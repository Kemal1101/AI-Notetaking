package chatbot

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
)

type GeminiChatRequest struct {
	Contents         []*GeminiChatContent        `json:"contents"`
	GenerationConfig *GeminiChatGenerationConfig `json:"generationConfig"`
}

type GeminiChatContent struct {
	Parts []*GeminiChatParts `json:"parts"`
	Role  string             `json:"role"`
}

type GeminiChatParts struct {
	Text string `json:"text"`
}

type ChatHistory struct {
	Chat string
	Role string
}

type GeminiChatCandidate struct {
	Content *GeminiChatContent `json:"content"`
}

type GeminiChatResponse struct {
	Candidates []*GeminiChatCandidate `json:"candidates"`
}

type GeminiChatPropertySchema struct {
	Type string `json:"type"`
}

type GeminiChatAppSchema struct {
	AnswerDirectly *GeminiChatPropertySchema `json:"answer_directly"`
}

type GeminiChatResponseSchema struct {
	Type       string               `json:"type"`
	Properties *GeminiChatAppSchema `json:"properties"`
	Required   []string             `json:"required"`
}

type GeminiChatGenerationConfig struct {
	ResponsMimeType string                    `json:"responseMimeType"`
	ResponeSchema   *GeminiChatResponseSchema `json:"responseSchema"`
}

type GeminiResponseAppSchema struct {
	AnswerDirectly bool `json:"answer_directly"`
}

func toGeminiContents(chatHistories []*ChatHistory) []*GeminiChatContent {
	chatContents := make([]*GeminiChatContent, len(chatHistories))
	for i, chatHistory := range chatHistories {
		chatContents[i] = &GeminiChatContent{
			Parts: []*GeminiChatParts{
				{
					Text: chatHistory.Chat,
				},
			},
			Role: chatHistory.Role,
		}
	}
	return chatContents
}

func GetGeminiResponse(
	ctx context.Context,
	apiKey string,
	chatHistories []*ChatHistory,
) (string, error) {
	chatContents := toGeminiContents(chatHistories)
	for _, chatHistory := range chatHistories {
		chatContents = append(chatContents, &GeminiChatContent{
			Parts: []*GeminiChatParts{
				{
					Text: chatHistory.Chat,
				},
			},
			Role: chatHistory.Role,
		})
	}

	payload := GeminiChatRequest{
		Contents: chatContents,
	}
	payloadJson, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest(
		"POST",
		"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
		bytes.NewBuffer(payloadJson),
	)
	if err != nil {
		return "", err
	}
	req.Header.Set("x-goog-api-key", apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf(
			"unexpected status code: %d, response body: %s", resp.StatusCode, string(respBody),
		)
	}

	var geminiResp GeminiChatResponse
	err = json.Unmarshal(respBody, &geminiResp)
	if err != nil {
		return "", err
	}
	return geminiResp.Candidates[0].Content.Parts[0].Text, nil
}

func DecideToUseRag(
	ctx context.Context,
	apiKey string,
	chatHistories []*ChatHistory,
) (bool, error) {
	// Menggunakan helper function yang baru untuk menghindari duplikasi
	chatContents := toGeminiContents(chatHistories)

	payload := GeminiChatRequest{
		Contents: chatContents,
		GenerationConfig: &GeminiChatGenerationConfig{
			ResponsMimeType: "application/json",
			ResponeSchema: &GeminiChatResponseSchema{
				Type: "OBJECT",
				Properties: &GeminiChatAppSchema{
					AnswerDirectly: &GeminiChatPropertySchema{
						Type: "BOOLEAN",
					},
				},
				Required: []string{
					"answer_directly",
				},
			},
		},
	}
	payloadJson, err := json.Marshal(payload)
	if err != nil {
		return false, err
	}
	req, err := http.NewRequest(
		"POST",
		"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", // Menggunakan model yang lebih baru jika memungkinkan
		bytes.NewBuffer(payloadJson),
	)
	if err != nil {
		return false, err
	}
	req.Header.Set("x-goog-api-key", apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{} // Sedikit lebih efisien untuk menggunakan pointer
	resp, err := client.Do(req)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close() // Praktik yang baik untuk selalu menutup body respons

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return false, err
	}
	if resp.StatusCode != http.StatusOK {
		return false, fmt.Errorf(
			"unexpected status code: %d, response body: %s", resp.StatusCode, string(respBody),
		)
	}

	var geminiResp GeminiChatResponse
	if err := json.Unmarshal(respBody, &geminiResp); err != nil {
		return false, err
	}
	if len(geminiResp.Candidates) == 0 || len(geminiResp.Candidates[0].Content.Parts) == 0 {
		return false, fmt.Errorf("invalid or empty response from Gemini")
	}

	var appSchema GeminiResponseAppSchema
	// Langsung unmarshal dari text di dalam respons
	err = json.Unmarshal([]byte(geminiResp.Candidates[0].Content.Parts[0].Text), &appSchema)
	if err != nil {
		return false, err
	}

	// Logika: Gunakan RAG jika model TIDAK bisa menjawab secara langsung.
	shouldUseRag := !appSchema.AnswerDirectly
	log.Printf("Gemini decision: AnswerDirectly=%v. Should use RAG: %v", appSchema.AnswerDirectly, shouldUseRag)
	return shouldUseRag, nil
}
