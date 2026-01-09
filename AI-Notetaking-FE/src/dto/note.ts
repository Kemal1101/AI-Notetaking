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