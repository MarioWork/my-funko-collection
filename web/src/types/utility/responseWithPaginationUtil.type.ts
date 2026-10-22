export interface ResponseWithPaginationUtil<T> {
  data: T[];
  totalResultNumber: number;
  currentPage: number;
}
