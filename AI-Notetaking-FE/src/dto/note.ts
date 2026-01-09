export interface CreateNoteRequest{
    title : string;
    content : string;
    notebook_id : string;
}

export interface CreateNoteResponse{
    id : string;
}