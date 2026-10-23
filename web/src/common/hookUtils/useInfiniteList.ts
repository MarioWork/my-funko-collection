import { useEffect, useState } from 'react';
import { NavigationType, useFetcher, useLocation, useNavigationType } from 'react-router';
import { ApiUrlParamsUtil, type ResponseWithPaginationUtil } from '@app-types/utility';

type Options<Item> = {
  // Page 1, from the route's loader. Search, filters and sort live in the URL, so a new page 1 means a new list.
  firstPage: ResponseWithPaginationUtil<Item>;
  // Picks the list out of the loader's data when a later page arrives.
  pageOf: (loaderData: unknown) => ResponseWithPaginationUtil<Item> | null | undefined;
  // A stable id per item, so an item that moved pages after a change is not shown twice.
  keyOf: (item: Item) => string | number;
};

type ListState<Item> = {
  listKey: string;
  firstPage: ResponseWithPaginationUtil<Item>;
  laterItems: Item[];
  lastPage: number;
  appliedData: unknown;
};

type CachedList<Item> = Pick<ListState<Item>, 'laterItems' | 'lastPage'> & {
  scrollY: number;
};

const FIRST_PAGE = 1;
// The lists the user browsed, so Back puts back what was loaded and where they were. Lives until a reload.
const listCache = new Map<string, CachedList<unknown>>();

// The list's identity: its path and URL state without the page.
function listKeyOf(pathname: string, search: string): string {
  const params = new URLSearchParams(search);

  params.delete(ApiUrlParamsUtil.page);

  return `${pathname}?${params.toString()}`;
}

function uniqueByKey<Item>(items: Item[], keyOf: Options<Item>['keyOf']): Item[] {
  const seen = new Set<string | number>();

  return items.filter((item) => {
    const key = keyOf(item);

    if (seen.has(key)) return false;

    seen.add(key);

    return true;
  });
}

// Infinite scroll on top of the server's pages: page 1 comes from the loader, each next page is the same route's
// loader again (through a fetcher) with `page` set, appended below. A new search, filter or sort starts over; a
// revalidation after a write refreshes page 1 and keeps what was appended. Back restores the pages and the scroll.
export function useInfiniteList<Item>({ firstPage, pageOf, keyOf }: Options<Item>) {
  const fetcher = useFetcher();
  const location = useLocation();
  const navigationType = useNavigationType();
  const listKey = listKeyOf(location.pathname, location.search);

  const [list, setList] = useState<ListState<Item>>(() => {
    const cached = navigationType === NavigationType.Pop ? listCache.get(listKey) : undefined;

    return {
      listKey,
      firstPage,
      laterItems: (cached?.laterItems as Item[] | undefined) ?? [],
      lastPage: cached?.lastPage ?? FIRST_PAGE,
      appliedData: fetcher.data,
    };
  });

  // A new page 1 (derived during render, no effect): same list → keep the appended pages; another list → start over.
  if (list.firstPage !== firstPage) {
    const isSameList = list.listKey === listKey;

    setList({
      listKey,
      firstPage,
      laterItems: isSameList ? list.laterItems : [],
      lastPage: isSameList ? list.lastPage : FIRST_PAGE,
      appliedData: fetcher.data,
    });
  }

  // A later page arrived: append it, once.
  const arrivedPage = list.appliedData === fetcher.data ? null : pageOf(fetcher.data);

  if (arrivedPage && list.listKey === listKey) {
    setList({
      ...list,
      laterItems: [...list.laterItems, ...arrivedPage.data],
      lastPage: arrivedPage.currentPage,
      appliedData: fetcher.data,
    });
  }

  const items = uniqueByKey([...firstPage.data, ...list.laterItems], keyOf);
  const total = firstPage.totalResultNumber;
  const hasMore = items.length < total;
  const isLoading = fetcher.state === 'loading';

  const loadMore = () => {
    if (isLoading || !hasMore) return;

    const params = new URLSearchParams(location.search);

    params.set(ApiUrlParamsUtil.page, String(list.lastPage + 1));
    void fetcher.load(`${location.pathname}?${params.toString()}`);
  };

  // Remember what is loaded and, as the user scrolls, where they are: read at unmount it would already be wrong,
  // since the next page has replaced this one by then.
  useEffect(() => {
    const entry: CachedList<unknown> = {
      laterItems: list.laterItems,
      lastPage: list.lastPage,
      scrollY: listCache.get(list.listKey)?.scrollY ?? 0,
    };
    const rememberScroll = () => {
      entry.scrollY = window.scrollY;
    };

    listCache.set(list.listKey, entry);
    window.addEventListener('scroll', rememberScroll, { passive: true });

    return () => window.removeEventListener('scroll', rememberScroll);
  }, [list.listKey, list.laterItems, list.lastPage]);

  // Coming Back: the pages are already restored above, so the old scroll position exists again.
  useEffect(() => {
    const cached = navigationType === NavigationType.Pop ? listCache.get(listKey) : undefined;

    if (cached?.scrollY) window.scrollTo({ top: cached.scrollY });
    // Only on arrival: the list's own later changes must not scroll the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { items, total, hasMore, isLoading, loadMore };
}
