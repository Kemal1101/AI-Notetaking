package controller

import (
	"ai-notetaking-be/internal/pkg/serverutils"
	"ai-notetaking-be/internal/service"

	"github.com/gofiber/fiber/v2"
)

type IChatbotController interface {
	RegisterRoutes(r fiber.Router)
	CreateSession(ctx *fiber.Ctx) error
	GetAllSession(ctx *fiber.Ctx) error
}

type chatbotController struct {
	chatbotService service.IChatbotService
}

func NewChatbotController(chatbotService service.IChatbotService) IChatbotController {
	return &chatbotController{
		chatbotService: chatbotService,
	}
}

func (c *chatbotController) RegisterRoutes(r fiber.Router) {
	h := r.Group("/chatbot/v1")
	h.Get("/sessions", c.GetAllSession)
	h.Post("/create-session", c.CreateSession)
}

func (c *chatbotController) CreateSession(ctx *fiber.Ctx) error {
	res, err := c.chatbotService.CreateSession(ctx.Context())
	if err != nil {
		return err
	}

	return ctx.JSON(serverutils.SuccessResponse("Success create session", res))
}

func (c *chatbotController) GetAllSession(ctx *fiber.Ctx) error {
	res, err := c.chatbotService.GetAllSession(ctx.Context())
	if err != nil {
		return err
	}

	return ctx.JSON(serverutils.SuccessResponse("Success get all sessions", res))
}