export interface GetAllSessionsResponse {
    id: string;
    title: string;
    created_at: Date;
    updated_at: Date | null;
}

export interface GetChatHistoryResponse {
    id: string;
    role: string;
    chat: string;
    created_at: Date;
}

export interface CreateSessionResponse{
    id: string;
} 

export interface DeleteSessionRequest {
    chat_session_id: string;
}

export interface SendChatRequest {
    chat_session_id: string;
    chat: string;
}

export interface SendChatResponseChat {
    id: string;
    chat: string;
    role: string;
    created_at: Date;
}

export interface SendChatResponse {
    chat_session_id: string;
    title: string;
    sent: SendChatResponseChat;
    reply: SendChatResponseChat;
}