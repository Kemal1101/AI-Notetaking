export interface GetAllNotebooksResponse {
    id : string;
    name : string;
    parent_id : string | null;
    created_at : Date;
    updated_at : Date;
}