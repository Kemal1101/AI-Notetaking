package service

import (
	"ai-notetaking-be/internal/dto"
	"ai-notetaking-be/internal/entity"
	"ai-notetaking-be/internal/repository"
	"context"
	"time"

	"github.com/google/uuid"
)

type INotebookService interface {
	Create(ctx context.Context, req *dto.CreateNotebookRequest) (*dto.CreateNotebookResponse, error)
}

type notebookService struct {
	notebookRepository repository.INotebookRepository
}

func NewNotebookService(notebookRepository repository.INotebookRepository) INotebookService {
	return &notebookService{
		notebookRepository: notebookRepository,
	}
}

func (c *notebookService) Create(ctx context.Context, req *dto.CreateNotebookRequest) (*dto.CreateNotebookResponse, error) {
	notebook := entity.Notebook{
		Id:       uuid.New(),
		Name:     req.Name,
		ParentId: req.ParentId,
		CreatedAt: time.Now(),
	}
	err := c.notebookRepository.Create(ctx, &notebook)
	if err != nil {
		return nil, err
	}

	return &dto.CreateNotebookResponse{
		Id: notebook.Id,
	}, nil
}
