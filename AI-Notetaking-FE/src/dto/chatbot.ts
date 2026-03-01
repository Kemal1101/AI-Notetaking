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