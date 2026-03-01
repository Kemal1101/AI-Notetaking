export interface Message {
    id: string
    role: "user" | "assistant"
    content: string
    timestamp: Date
}

export interface ChatSession {
    id: string
    name: string
    messages: Message[]
    created_at: Date
    updated_at: Date
}