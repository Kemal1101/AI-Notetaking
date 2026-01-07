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
	Show(ctx context.Context, id uuid.UUID) (*dto.ShowNoteResponse, error)
	Update(ctx context.Context, req *dto.UpdateNoteRequest) (*dto.UpdateNoteResponse, error)
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

func (c *noteService) Show(ctx context.Context, id uuid.UUID) (*dto.ShowNoteResponse, error) {
	note, err := c.noteRepository.GetById(ctx, id)
	if err != nil {
		return nil, err
	}

	res := dto.ShowNoteResponse{
		Id:         note.Id,
		Title:      note.Title,
		Content:    note.Content,
		NotebookId: note.NotebookId,
		CreatedAt:  note.CreatedAt,
		UpdatedAt:  note.UpdatedAt,
	}

	return &res, nil
}

func (c *noteService) Update(ctx context.Context, req *dto.UpdateNoteRequest) (*dto.UpdateNoteResponse, error) {
	note, err := c.noteRepository.GetById(ctx, req.Id)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	note.Title = req.Title
	note.Content = req.Content
	note.UpdatedAt = &now

	err = c.noteRepository.Update(ctx, note)
	if err != nil {
		return nil, err
	}
	
	return &dto.UpdateNoteResponse{
		Id: note.Id,
	}, nil
}	