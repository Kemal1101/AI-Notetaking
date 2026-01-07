package repository

import (
	"ai-notetaking-be/internal/entity"
	"ai-notetaking-be/pkg/database"
	"context"
	"github.com/jackc/pgx/v5/pgxpool"
)

type INoteRepository interface {
	UsingTx(ctx context.Context, tx database.DatabaseQueryer) INoteRepository
	Create(ctx context.Context, note *entity.Note) error
}

type noteRepository struct {
	db database.DatabaseQueryer
}

func NewNoteRepository(db *pgxpool.Pool) INoteRepository {
	return &noteRepository{
		db: db,
	}
}

func (n *noteRepository) UsingTx(ctx context.Context, tx database.DatabaseQueryer) INoteRepository {
	return &noteRepository{
		db: tx,
	}
}

func (n *noteRepository) Create(ctx context.Context, note *entity.Note) error {
	_, err := n.db.Exec(
		ctx,
		`INSERT INTO note (id, title, content, notebook_id, created_at, updated_at, deleted_at, is_deleted) values ($1, $2, $3, $4, $5, $6, $7, $8)`,
		note.Id,
		note.Title,
		note.Content,
		note.NotebookId,
		note.CreatedAt,
		note.UpdatedAt,
		note.DeletedAt,
		note.IsDeleted,
	)
	if err != nil {
		return err
	}

	return nil
}
