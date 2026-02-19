package chatbot

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

type GeminiChatRequest struct {
	Contents []*GeminiChatContent `json:"contents"`
}

type GeminiChatContent struct {
	Parts []*GeminiChatParts `json:"parts"`
	Role  string `json:"role"`
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

func GetGeminiResponse(
	ctx context.Context,
	apiKey string,
	chatHistories []*ChatHistory,
)(string, error) {
	chatContents := make([]*GeminiChatContent, 0)
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
		"https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent",
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
		return  "", fmt.Errorf(
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