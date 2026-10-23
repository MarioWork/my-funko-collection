import type { PaginationUtil, ResponseWithPaginationUtil } from '@app-types/utility';

// The API's largest page.
const MAX_PAGE_SIZE = 100;
const FIRST_PAGE = 1;

type PageFetcher<Item> = (pagination: PaginationUtil) => Promise<ResponseWithPaginationUtil<Item>>;

// Every row of a paged list: the first page tells how many there are, the rest are fetched together. For option
// lists (dropdowns, pickers), which must never stop at the first hundred.
export async function fetchEveryPage<Item>(fetchPage: PageFetcher<Item>): Promise<Item[]> {
  const size = String(MAX_PAGE_SIZE);
  const firstPage = await fetchPage({ page: String(FIRST_PAGE), size });
  const pageCount = Math.ceil(firstPage.totalResultNumber / MAX_PAGE_SIZE);
  const laterPageNumbers = Array.from({ length: Math.max(0, pageCount - FIRST_PAGE) }, (_, index) => index + 2);
  const laterPages = await Promise.all(laterPageNumbers.map((page) => fetchPage({ page: String(page), size })));

  return [firstPage, ...laterPages].flatMap((response) => response.data);
}
