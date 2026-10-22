export interface PaginationUtil {
  page: string;
  size: string;
}

export const PAGE_SIZE = '10';
export const DEFAULT_FIRST_PAGE = '1';

export const DEFAULT_PAGINATION: PaginationUtil = { page: DEFAULT_FIRST_PAGE, size: PAGE_SIZE };
