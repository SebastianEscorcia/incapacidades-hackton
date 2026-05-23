export interface ContentResponse<T> {
    status: boolean;
    statusCode: number;
    data: T;
    message?: string;
    metadata?: MetadataType;

}
export type MetadataType = {
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
};

export interface PaginatedData<T> {
    page: T;
    metadata?: MetadataType;
}