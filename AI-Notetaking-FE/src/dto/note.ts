export interface CreateNoteRequest{
    title : string;
    content : string;
    notebook_id : string;
}

export interface CreateNoteResponse{
    id : string;
}

export interface UpdateNoteRequest{
    title: string;
    content: string;
}
export interface UpdateNoteResponse{
    id : string;
}

export interface MoveNoteRequest{
    notebook_id : string;
}

export interface MoveNoteResponse{
    id : string;
}

export interface GetSemanticSearchResponse{
    id : string;
    title : string;
    content : string;
    notebook_id : string;
    created_at : Date;
    updated_at : Date | null;
}