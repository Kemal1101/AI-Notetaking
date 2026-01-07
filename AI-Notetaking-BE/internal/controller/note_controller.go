package controller

import (
	"ai-notetaking-be/internal/dto"
	"ai-notetaking-be/internal/pkg/serverutils"
	"ai-notetaking-be/internal/service"

	// "ai-notetaking-be/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	// "github.com/google/uuid"
)

type INoteController interface {
	RegisterRoutes(r fiber.Router)
	Create(ctx *fiber.Ctx) error
	Show(ctx *fiber.Ctx) error
	Update(ctx *fiber.Ctx) error
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
	h.Get("/:id", c.Show)
	h.Put("/:id", c.Update)
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

func (c *noteController) Show(ctx *fiber.Ctx) error {
	idParam := ctx.Params("id")
	id, _ := uuid.Parse(idParam)
	res, err := c.noteService.Show(ctx.Context(), id)
	if err != nil {
		return err
	}
	return ctx.JSON(serverutils.SuccessResponse("Success show note", res))
}

func (c *noteController) Update(ctx *fiber.Ctx) error {
	idParam := ctx.Params("id")
	id, _ := uuid.Parse(idParam)

	var req dto.UpdateNoteRequest
	if err := ctx.BodyParser(&req); err != nil {
		return err
	}

	req.Id = id

	err := serverutils.ValidateRequest(req)
	if err != nil {
		return err
	}

	res, err := c.noteService.Update(ctx.Context(), &req)
	if err != nil {
		return err
	}

	return ctx.JSON(serverutils.SuccessResponse("Success update note", res))
}