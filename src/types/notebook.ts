export interface Notebook {
    id: string
    name: string
    parentId: string | null
    createdAt: Date
    updatedAt: Date
}