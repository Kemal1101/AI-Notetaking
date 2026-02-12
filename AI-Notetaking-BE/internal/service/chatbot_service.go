package service

import (
	"ai-notetaking-be/internal/constant"
	"ai-notetaking-be/internal/dto"
	"ai-notetaking-be/internal/entity"
	"ai-notetaking-be/internal/repository"
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type IChatbotService interface {
	CreateSession(ctx context.Context) (*dto.CreateSessionResponse, error)
	GetAllSession(ctx context.Context) ([]*dto.GetAllSessionResponse, error)
	GetChatHistory(ctx context.Context, sessionId uuid.UUID) ([]*dto.GetChatHistoryResponse, error)
}

type chatbotService struct{
	db *pgxpool.Pool
	chatSessionRepository repository.IChatSessionRepository
	chatMessageRepository repository.IChatMessageRepository
	chatMessageRawRepository repository.IChatMessageRawRepository
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

func NewChatbotService(
	db *pgxpool.Pool,
	chatSessionRepository repository.IChatSessionRepository,
	chatMessageRepository repository.IChatMessageRepository,
	chatMessageRawRepository repository.IChatMessageRawRepository,
) IChatbotService {
	return &chatbotService{
		db: db,
		chatSessionRepository: chatSessionRepository,
		chatMessageRepository: chatMessageRepository,
		chatMessageRawRepository: chatMessageRawRepository,
	}
}
