package service

import (
	"ai-notetaking-be/internal/dto"
	"ai-notetaking-be/internal/entity"
	"ai-notetaking-be/internal/repository"
	"ai-notetaking-be/pkg/embedding"
	"context"
	"encoding/json"
	"os"
	"time"

	"github.com/google/uuid"
)

type INoteService interface {
	Create(ctx context.Context, req *dto.CreateNoteRequest) (*dto.CreateNoteResponse, error)
	Show(ctx context.Context, id uuid.UUID) (*dto.ShowNoteResponse, error)
	Update(ctx context.Context, req *dto.UpdateNoteRequest) (*dto.UpdateNoteResponse, error)
	Delete(ctx context.Context, id uuid.UUID) error
	MoveNote(ctx context.Context, req *dto.MoveNoteRequest) (*dto.MoveNoteResponse, error)
	SemanticSearch(ctx context.Context, query string) ([]*dto.SemanticSearchResponse, error)
}

type noteService struct {
	noteRepository          repository.INoteRepository
	noteEmbeddingRepository repository.INoteEmbeddingRepository
	publisherService        IPublisherService
}

func NewNoteService(noteRepository repository.INoteRepository, noteEmbeddingRepository repository.INoteEmbeddingRepository, publisherService IPublisherService) INoteService {
	return &noteService{
		noteRepository:          noteRepository,
		noteEmbeddingRepository: noteEmbeddingRepository,
		publisherService:        publisherService,
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

	msgPayload := dto.PublishEmbedNoteMessage{
		NoteId: note.Id,
	}
	msgJson, err := json.Marshal(msgPayload)
	if err != nil {
		return nil, err
	}
	err = c.publisherService.Publish(ctx, msgJson)
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

	payload := dto.PublishEmbedNoteMessage{
		NoteId: note.Id,
	}

	payloadJson, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	err = c.publisherService.Publish(ctx, payloadJson)
	if err != nil {
		return nil, err
	}

	return &dto.UpdateNoteResponse{
		Id: note.Id,
	}, nil
}

func (c *noteService) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := c.noteRepository.GetById(ctx, id)
	if err != nil {
		return err
	}

	err = c.noteRepository.Delete(ctx, id)
	if err != nil {
		return err
	}

	return nil
}

func (c *noteService) MoveNote(ctx context.Context, req *dto.MoveNoteRequest) (*dto.MoveNoteResponse, error) {
	note, err := c.noteRepository.GetById(ctx, req.Id)
	if err != nil {
		return nil, err
	}

	note.NotebookId = req.NotebookId
	now := time.Now()
	note.UpdatedAt = &now

	err = c.noteRepository.Update(ctx, note)
	if err != nil {
		return nil, err
	}

	return &dto.MoveNoteResponse{
		Id:         note.Id,
		NotebookId: note.NotebookId,
	}, nil
}

func (c *noteService) SemanticSearch(ctx context.Context, search string) ([]*dto.SemanticSearchResponse, error) {
    embeddingResponse, err := embedding.GetGeminiEmbedding(
        os.Getenv("GOOGLE_GEMINI_API_KEY"),
        search,
        "RETRIEVAL_QUERY",
    )
    if err != nil {
        return nil, err
    }

    noteEmbeddings, err := c.noteEmbeddingRepository.SemanticSearch(ctx, embeddingResponse.Embedding.Values)
    if err != nil {
        return nil, err
    }


    if len(noteEmbeddings) == 0 {
        return []*dto.SemanticSearchResponse{}, nil
    }

    ids := make([]uuid.UUID, 0)
    for _, noteEmbedding := range noteEmbeddings {
        ids = append(ids, noteEmbedding.NoteId)
    }

    notes, err := c.noteRepository.GetByIds(ctx, ids)
    if err != nil {
        // This is a likely place for an error that gets converted to 404
        return nil, err
    }


    notesMap := make(map[uuid.UUID]*entity.Note)
    for _, n := range notes {
        notesMap[n.Id] = n
    }

    res := make([]*dto.SemanticSearchResponse, 0)
    for _, noteEmbedding := range noteEmbeddings {
        if n, ok := notesMap[noteEmbedding.NoteId]; ok {
            noteRes := &dto.SemanticSearchResponse{
                Id:         n.Id,
                Title:      n.Title,
                Content:    n.Content,
                NotebookId: n.NotebookId,
                CreatedAt:  n.CreatedAt,
                UpdatedAt:  n.UpdatedAt,
            }
            res = append(res, noteRes)
        }
    }

    return res, nil
}
