package main

import (
	"ai-notetaking-be/internal/controller"
	"ai-notetaking-be/internal/pkg/serverutils"
	"ai-notetaking-be/internal/repository"
	"ai-notetaking-be/internal/service"
	"ai-notetaking-be/pkg/database"
	"log"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()

	// Set timezone to WIB (Asia/Jakarta - UTC+7)
	loc, err := time.LoadLocation("Asia/Jakarta")
	if err != nil {
		log.Fatalf("Failed to load location: %v", err)
	} else {
		time.Local = loc
		log.Printf("Timezone set to WIB (Asia/Jakarta): %v", time.Now())
	}

	app := fiber.New(fiber.Config{
		BodyLimit: 10 * 1024 * 1024,
	})

	app.Use(cors.New())

	app.Use(serverutils.ErrorHandlerMiddleware())

	db := database.ConnectDB(os.Getenv("DB_CONNECTION_STRING"))

	exampleRepository := repository.NewExampleRepository(db)
	notebookRepository := repository.NewNotebookRepository(db)
	noteRepository := repository.NewNoteRepository(db)

	exampleService := service.NewExampleService(exampleRepository)
	notebookService := service.NewNotebookService(notebookRepository, noteRepository, db)
	noteService := service.NewNoteService(noteRepository)

	exampleController := controller.NewExampleController(exampleService)
	notebookController := controller.NewNotebookController(notebookService)
	noteController := controller.NewNoteController(noteService)

	api := app.Group("/api")
	exampleController.RegisterRoutes(api)
	notebookController.RegisterRoutes(api)
	noteController.RegisterRoutes(api)

	log.Fatal(app.Listen(":3000"))
}
