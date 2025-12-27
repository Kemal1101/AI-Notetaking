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
    createdAt: Date
    updatedAt: Date
}