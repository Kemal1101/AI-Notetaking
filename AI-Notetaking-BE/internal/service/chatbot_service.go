package service

import (
	"ai-notetaking-be/internal/constant"
	"ai-notetaking-be/internal/dto"
	"ai-notetaking-be/internal/entity"
	"ai-notetaking-be/internal/repository"
	"ai-notetaking-be/pkg/chatbot"
	"ai-notetaking-be/pkg/embedding"
	"context"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type IChatbotService interface {
	CreateSession(ctx context.Context) (*dto.CreateSessionResponse, error)
	GetAllSession(ctx context.Context) ([]*dto.GetAllSessionResponse, error)
	GetChatHistory(ctx context.Context, sessionId uuid.UUID) ([]*dto.GetChatHistoryResponse, error)
	SendChat (ctx context.Context, req *dto.SendChatRequest) (*dto.SendChatResponse, error)
}

type chatbotService struct{
	db *pgxpool.Pool
	chatSessionRepository repository.IChatSessionRepository
	chatMessageRepository repository.IChatMessageRepository
	chatMessageRawRepository repository.IChatMessageRawRepository
	noteEmbeddingRepository repository.INoteEmbeddingRepository
}

func (cs *chatbotService) CreateSession(ctx context.Context) (*dto.CreateSessionResponse, error) {
	now := time.Now()
	chatSession := entity.ChatSession{
		Id:        uuid.New(),
		Title:     "New Chat Session",
		CreatedAt: now,
	}
	chatMessage := entity.ChatMessage{
		Id:            uuid.New(),
		Chat:          "Hello! How can I assist you today?",
		Role:          constant.ChatMessageRoleModel,
		ChatSessionId: chatSession.Id,
		CreatedAt:     now,
	}
	chatMessageRawUser := entity.ChatMessageRaw{
		Id:            uuid.New(),
		Chat:          constant.ChatMessageRawInitialUserPromptV1,
		Role:          constant.ChatMessageRoleUser,
		ChatSessionId: chatSession.Id,
		CreatedAt:     now,
	}
	chatMessageRawModel := entity.ChatMessageRaw{
		Id:            uuid.New(),
		Chat:          constant.ChatMessageRawInitialModelPromptV1,
		Role:          constant.ChatMessageRoleModel,
		ChatSessionId: chatSession.Id,
		CreatedAt:     now.Add(1 * time.Second),
	}

	tx , err := cs.db.Begin(ctx)
	if err != nil {
		return nil,  err
	}
	defer tx.Rollback(ctx)

	chatSessionRepository := cs.chatSessionRepository.UsingTx(ctx, tx)
	chatMessageRepository := cs.chatMessageRepository.UsingTx(ctx, tx)
	chatMessageRawRepository := cs.chatMessageRawRepository.UsingTx(ctx, tx)

	err = chatSessionRepository.Create(ctx, &chatSession)
	if err != nil {
		return nil, err
	}	
	err = chatMessageRepository.Create(ctx, &chatMessage)
	if err != nil {
		return nil, err
	}
	err = chatMessageRawRepository.Create(ctx, &chatMessageRawUser)
	if err != nil {
		return nil, err
	}
	err = chatMessageRawRepository.Create(ctx, &chatMessageRawModel)
	if err != nil {
		return nil, err
	}

	err = tx.Commit(ctx)
	if err != nil {
		return nil, err
	}

	return &dto.CreateSessionResponse{
		Id: chatSession.Id,
	}, nil

}

func (cs *chatbotService) GetAllSession(ctx context.Context) ([]*dto.GetAllSessionResponse, error) {
	chatSessions, err := cs.chatSessionRepository.GetAll(ctx)
	if err != nil {
		return nil, err
	}

	res := make([]*dto.GetAllSessionResponse, 0)
	for _, chatSession := range chatSessions {
		res = append(res, &dto.GetAllSessionResponse{
			Id: chatSession.Id,
			Title: chatSession.Title,
			CreatedAt: chatSession.CreatedAt,
			UpdatedAt: chatSession.UpdatedAt,
		})
	}

	return res, nil
}

func (cs *chatbotService) GetChatHistory(ctx context.Context, sessionId uuid.UUID) ([]*dto.GetChatHistoryResponse, error) {
	_, err := cs.chatSessionRepository.GetById(ctx, sessionId)
	if err != nil {
		return nil, err
	} 
	
	chatMessage, err := cs.chatMessageRepository.GetBySessionId(ctx, sessionId.String())
	if err != nil {
		return nil, err
	}

	res := make([]*dto.GetChatHistoryResponse, 0)
	for _, chat := range chatMessage {
		res = append(res, &dto.GetChatHistoryResponse{
			Id: chat.Id,
			Role: chat.Role,
			Chat: chat.Chat,
			CreatedAt: chat.CreatedAt,
		})
	}

	return res, nil
}

func (cs *chatbotService) SendChat(ctx context.Context, req *dto.SendChatRequest) (*dto.SendChatResponse, error) {
	tx, err := cs.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	chatSessionRepository := cs.chatSessionRepository.UsingTx(ctx, tx)
	chatMessageRepository := cs.chatMessageRepository.UsingTx(ctx, tx)
	chatMessageRawRepository := cs.chatMessageRawRepository.UsingTx(ctx, tx)
	noteEmbeddingRepository := cs.noteEmbeddingRepository.UsingTx(ctx, tx)

	chatSession , err := chatSessionRepository.GetById(ctx, req.ChatSessionId)
	if err != nil {
		return nil, err
	}

	existingChatMessageRaw, err := chatMessageRawRepository.GetBySessionId(ctx, req.ChatSessionId)
	if err != nil {
		return nil, err
	}
	updateSessionTitle := len(existingChatMessageRaw) == 2

	now := time.Now()
	chatMessage := entity.ChatMessage{
		Id:            uuid.New(),
		Chat:          req.Chat,
		Role:          constant.ChatMessageRoleUser,
		ChatSessionId: req.ChatSessionId,
		CreatedAt:     now,
	}
	
	decideUseRAGChatHistories := []*chatbot.ChatHistory{
        {
            // Prompt sistem yang memberi tahu model apa yang harus dilakukan.
            Chat: "You are a helpful assistant. Based on the user's last question, decide if you need to search through external notes to provide a better answer. Your only output should be a JSON with a single key 'answer_directly' which is a boolean. If you need to search notes, 'answer_directly' should be false.",
            Role: constant.ChatMessageRoleModel, // Atau 'user' jika model lebih responsif
        },
        {
            Chat: req.Chat, // Hanya pertanyaan terakhir dari pengguna
            Role: constant.ChatMessageRoleUser,
        },
    }
	useRag, err := chatbot.DecideToUseRag(ctx, os.Getenv("GOOGLE_GEMINI_API_KEY"), decideUseRAGChatHistories)
    if err != nil {
        return nil, err
    }

    strBuilder := strings.Builder{}
    if useRag {
        // 2. Dapatkan embedding HANYA jika RAG diperlukan. Ini menghemat satu panggilan API jika tidak perlu.
        embeddingResponse, err := embedding.GetGeminiEmbedding(
            os.Getenv("GOOGLE_GEMINI_API_KEY"),
            req.Chat,
            "RETRIEVAL_QUERY",
        )
        if err != nil {
            return nil, err
        }

        noteEmbeddings, err := noteEmbeddingRepository.SearchSimilarity(ctx, embeddingResponse.Embedding.Values)
        if err != nil {
            return nil, err
        }

        if len(noteEmbeddings) > 0 {
            strBuilder.WriteString("--- Relevant Notes ---\n")
            for _, noteEmbedding := range noteEmbeddings {
                strBuilder.WriteString(noteEmbedding.Document)
                strBuilder.WriteString("\n")
            }
            strBuilder.WriteString("----------------------\n\n")
        }
    }

	strBuilder.WriteString("User next question: ")
	strBuilder.WriteString(req.Chat)
	strBuilder.WriteString("\n\n")
	strBuilder.WriteString("Your answer ?")
	chatMessageRaw := entity.ChatMessageRaw{
		Id:            uuid.New(),
		Chat:          strBuilder.String(),
		Role:          constant.ChatMessageRoleUser,
		ChatSessionId: req.ChatSessionId,
		CreatedAt:     now,
	}

	existingChatMessageRaw = append(existingChatMessageRaw, &chatMessageRaw)
	geminiReq := make([]*chatbot.ChatHistory, 0)
	for _, chat := range existingChatMessageRaw {
		geminiReq = append(geminiReq, &chatbot.ChatHistory{
			Chat: chat.Chat,
			Role: chat.Role,
		})
	}

	reply, err := chatbot.GetGeminiResponse(ctx, os.Getenv("GOOGLE_GEMINI_API_KEY"), geminiReq)
	if err != nil {
		return nil, err
	}
	chatMessageModel := entity.ChatMessage{
		Id:            uuid.New(),
		Chat:          reply,
		Role:          constant.ChatMessageRoleModel,
		ChatSessionId: req.ChatSessionId,
		CreatedAt:     now.Add(1 * time.Millisecond),
	}
	chatMessageModelRaw := entity.ChatMessageRaw{
		Id:            uuid.New(),
		Chat:          reply,
		Role:          constant.ChatMessageRoleModel,
		ChatSessionId: req.ChatSessionId,
		CreatedAt:     now.Add(1 * time.Millisecond),
	}

	err = chatMessageRepository.Create(ctx, &chatMessage)
	if err != nil {
		return nil, err
	}
	err = chatMessageRepository.Create(ctx, &chatMessageModel)
	if err != nil {
		return nil, err
	}
	err = chatMessageRawRepository.Create(ctx, &chatMessageRaw)
	if err != nil {
		return nil, err
	}
	err = chatMessageRawRepository.Create(ctx, &chatMessageModelRaw)
	if err != nil {
		return nil, err
	}

	if updateSessionTitle {
		chatSession.Title = req.Chat
		chatSession.UpdatedAt = &now
		err = chatSessionRepository.Update(ctx, chatSession)
		if err != nil {
			return nil, err
		}
	}

	err = tx.Commit(ctx)
	if err != nil {
		return nil, err
	}

	return &dto.SendChatResponse{
		ChatSessionId: chatSession.Id,
		ChatSessionTitle: chatSession.Title,
		Sent: &dto.SendChatResponseChat{
			Id: chatMessage.Id,
			Chat: chatMessage.Chat,
			Role: chatMessage.Role,
			CreatedAt: chatMessage.CreatedAt, 
		},
		Reply: &dto.SendChatResponseChat{
			Id: chatMessageModel.Id,
			Chat: chatMessageModel.Chat,
			Role: chatMessageModel.Role,
			CreatedAt: chatMessageModel.CreatedAt,
		},
	}, nil
}

func NewChatbotService(
	db *pgxpool.Pool,
	chatSessionRepository repository.IChatSessionRepository,
	chatMessageRepository repository.IChatMessageRepository,
	chatMessageRawRepository repository.IChatMessageRawRepository,
	noteEmbeddingRepository repository.INoteEmbeddingRepository,
) IChatbotService {
	return &chatbotService{
		db: db,
		chatSessionRepository: chatSessionRepository,
		chatMessageRepository: chatMessageRepository,
		chatMessageRawRepository: chatMessageRawRepository,
		noteEmbeddingRepository: noteEmbeddingRepository,
	}
}
