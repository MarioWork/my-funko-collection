// Set on the URL an infinite list's fetcher loads for its next page: the loader then skips everything but the list
// itself (the filters' option lists are already on screen), which saves several requests per page.
export const NEXT_PAGE_PARAM = 'nextPage';

export function isNextPageRequest(request: Request): boolean {
  return new URL(request.url).searchParams.has(NEXT_PAGE_PARAM);
}
