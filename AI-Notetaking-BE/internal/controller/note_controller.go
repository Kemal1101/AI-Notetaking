package controller

import (
	"ai-notetaking-be/internal/dto"
	"ai-notetaking-be/internal/pkg/serverutils"
	"ai-notetaking-be/internal/service"

	// "ai-notetaking-be/internal/service"

	"github.com/gofiber/fiber/v2"
	// "github.com/google/uuid"
)

type INoteController interface {
	RegisterRoutes(r fiber.Router)
	Create(ctx *fiber.Ctx) error
}

type noteController struct {
	noteService service.INoteService
}

func NewNoteController(noteService service.INoteService) INoteController {
	return &noteController{
		noteService: noteService,
	}
}

func (c *noteController) RegisterRoutes(r fiber.Router) {
	h := r.Group("/note/v1")
	h.Post("", c.Create)
}

func (c *noteController) Create(ctx *fiber.Ctx) error {
	var req dto.CreateNoteRequest
	if err := ctx.BodyParser(&req); err != nil {
		return err
	}

	err := serverutils.ValidateRequest(req)
	if err != nil {
		return err
	}

	res, err := c.noteService.Create(ctx.Context(), &req)
	if err != nil {
		return err
	}

	return ctx.JSON(serverutils.SuccessResponse("Success create note", res))
}