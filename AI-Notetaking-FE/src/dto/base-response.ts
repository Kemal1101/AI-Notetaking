export interface BaseResponse<T> {
    success: boolean;
    massage: string;
    code: number;
    data: T;
}