package service

import (
	"ai-notetaking-be/internal/dto"
	"ai-notetaking-be/internal/entity"
	"ai-notetaking-be/internal/repository"
	"ai-notetaking-be/pkg/embedding"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/ThreeDotsLabs/watermill/message"
	"github.com/ThreeDotsLabs/watermill/pubsub/gochannel"
	"github.com/gofiber/fiber/v2/log"
	"github.com/google/uuid"
)

type IConsumerService interface {
	Consume(ctx context.Context) error
}

type ConsumerService struct {
	notebookRepository repository.INotebookRepository
	noteRepository repository.INoteRepository
	noteEmbeddingRepository repository.INoteEmbeddingRepository
	pubSub    *gochannel.GoChannel
	topicName string
}

func (cs *ConsumerService) Consume(ctx context.Context) error {
	message, err := cs.pubSub.Subscribe(ctx, cs.topicName)
	if err != nil {
		return err
	}

	go func() {
		for msg := range message {
			cs.processMessage(ctx, msg)
		}
	}()
	return nil
}

func (cs *ConsumerService) processMessage(ctx context.Context, msg *message.Message) {
	defer msg.Nack()
	defer func() {
		if e := recover(); e != nil {
			log.Error(e)
		}
	}()

	var payload dto.PublishEmbedNoteMessage
	err := json.Unmarshal(msg.Payload, &payload)
	if err != nil {
		panic(err)
	}

	note, err := cs.noteRepository.GetById(ctx, payload.NoteId)
	if err != nil {
		panic(err)
	}
	notebook, err := cs.notebookRepository.GetById(ctx, note.NotebookId)
	if err != nil {
		panic(err)
	}

	noteUpdatedAt := "-"
	if note.UpdatedAt != nil {
		noteUpdatedAt = note.UpdatedAt.Format(time.RFC3339)
	}
	content := fmt.Sprintf(`
	Note Title: %s
	Notebook Title: %s
	%s

	Created At: %s
	Updated At: %s
	`,
	note.Title,
	notebook.Name,
	note.Content,
	note.CreatedAt.Format(time.RFC3339),
	noteUpdatedAt,
	)

	embeddingRes, err := embedding.GetGeminiEmbedding(
		os.Getenv("GOOGLE_GEMINI_API_KEY"),
		content,
	)
	if err != nil {
		panic(err)
	}

	noteEmbedding := &entity.NoteEmbedding{
		Id:             uuid.New(),
		Document:       content,
		EmbeddingValue: embeddingRes.Embedding.Values,
		NoteId:         note.Id,
		CreatedAt:      time.Now(),
		IsDeleted:      false,
	}

	err = cs.noteEmbeddingRepository.Create(ctx, noteEmbedding)
	if err != nil {
		panic(err)
	}

	msg.Ack()
}
func NewConsumerService(pubSub *gochannel.GoChannel, topicName string, notebookRepository repository.INotebookRepository, noteRepository repository.INoteRepository, noteEmbeddingRepository repository.INoteEmbeddingRepository) IConsumerService {
	return &ConsumerService{
		notebookRepository: notebookRepository,
		noteRepository: noteRepository,
		noteEmbeddingRepository: noteEmbeddingRepository,
		pubSub:    pubSub,
		topicName: topicName,
	}
}
