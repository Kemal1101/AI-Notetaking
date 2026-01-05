export interface GetAllNotebooksResponse {
    id : string;
    name : string;
    parent_id : string | null;
    created_at : Date;
    updated_at : Date | null;
}

export interface CreateNotebookRequest {
    name : string;
    parent_id : string | null;
}

export interface CreateNotebookResponse {
    id : string;
}

export interface UpdateNotebookRequest {
    name: string;
}

export interface UpdateNotebookResponse {
    id : string;
}

export interface MoveNotebookRequest {
    parent_id : string | null;
}

export interface MoveNotebookResponse {
    id : string;
}