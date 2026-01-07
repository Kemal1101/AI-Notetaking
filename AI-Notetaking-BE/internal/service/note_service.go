package service

import (
	"ai-notetaking-be/internal/dto"
	"ai-notetaking-be/internal/entity"
	"ai-notetaking-be/internal/repository"
	"context"
	"time"

	"github.com/google/uuid"
)

type INoteService interface {
	Create(ctx context.Context, req *dto.CreateNoteRequest) (*dto.CreateNoteResponse, error)

}

type noteService struct {
	noteRepository repository.INoteRepository
}

func NewNoteService(noteRepository repository.INoteRepository) INoteService {
	return &noteService{
		noteRepository: noteRepository,
	}
}

func (c *noteService) Create(ctx context.Context, req *dto.CreateNoteRequest) (*dto.CreateNoteResponse, error) {
	note := entity.Note{
		Id:         uuid.New(),
		Title:      req.Title,
		Content:    req.Content,
		NotebookId: req.NotebookId,
		CreatedAt:  time.Now(),
	}
	err := c.noteRepository.Create(ctx, &note)
	if err != nil {
		return nil, err
	}

	return &dto.CreateNoteResponse{
		Id: note.Id,
	}, nil
}