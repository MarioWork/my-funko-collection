import { ApiUrlParamsUtil, SortingDirectionUtil, type ResponseWithPaginationUtil } from '@app-types/utility';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const ID_SEPARATOR = ',';
const TRUE_PARAM_VALUE = 'true';

type FieldReader<T> = (item: T) => string | number | boolean | Date | null | undefined;

type MockRange<T> = { from: string; to: string; read: (item: T) => string };

type MockListOptions<T> = {
  /** Keyed by the service's `*ApiSearchFields` values, the names the request carries. */
  filters?: Record<string, FieldReader<T>>;
  ranges?: MockRange<T>[];
  /** Keyed by the service's `*ApiSortingFields` values. */
  sorts?: Record<string, FieldReader<T>>;
};

// Text matches loosely, as the endpoints do. The rest matches whole, or `PT` answers for `PTX`.
const matches = (value: ReturnType<FieldReader<unknown>>, wanted: string) =>
  typeof value === 'string' ? value.toLowerCase().includes(wanted.toLowerCase()) : String(value) === wanted;

const compare = (value: ReturnType<FieldReader<unknown>>, other: ReturnType<FieldReader<unknown>>) => {
  if (typeof value === 'number' && typeof other === 'number') return value - other;

  return String(value ?? '').localeCompare(String(other ?? ''));
};

// A comma-separated id param (`tagId=1,4`); undefined when the request does not send it.
export function idList(value: string | null): number[] | undefined {
  return value ? value.split(ID_SEPARATOR).map(Number) : undefined;
}

// A boolean query param, read the way the API reads it: only `true` is true.
export function isTrueParam(value: string | null): boolean {
  return value === TRUE_PARAM_VALUE;
}

// Joined into one string, so the row matches when any one of its values does.
export const anyOf = <T, V>(values: T[], read: (value: T) => V) => values.map(read).join(' ');

// A field the handler does not name is ignored, as the real endpoint ignores it.
export function paginateMockList<T>(
  request: Request,
  items: T[],
  { filters = {}, ranges = [], sorts = {} }: MockListOptions<T> = {},
): ResponseWithPaginationUtil<T> {
  const params = new URL(request.url).searchParams;

  const matched = Object.entries(filters).reduce((rows, [field, read]) => {
    const wanted = params.get(field);

    return wanted ? rows.filter((row) => matches(read(row), wanted)) : rows;
  }, items);

  // Compared as text: the endpoints carry both ends as ISO timestamps, which sort that way.
  const narrowed = ranges.reduce((rows, { from, to, read }) => {
    const after = params.get(from);
    const before = params.get(to);

    return rows.filter((row) => {
      const isAfterStart = !after || read(row) >= after;
      const isBeforeEnd = !before || read(row) <= before;

      return isAfterStart && isBeforeEnd;
    });
  }, matched);

  // Comma-separated: a second field breaks ties on the first.
  const sortReaders = (params.get(ApiUrlParamsUtil.sorting_fields) ?? '')
    .split(',')
    .flatMap((field) => (sorts[field] ? [sorts[field]] : []));

  const ordered = [...narrowed].sort((row, other) =>
    sortReaders.reduce((result, read) => (result === 0 ? compare(read(row), read(other)) : result), 0),
  );

  if (params.get(ApiUrlParamsUtil.sortingDirection) === SortingDirectionUtil.DESC) {
    ordered.reverse();
  }

  return pageMockList(params, ordered);
}

// The paging step alone, for a handler that has to order its rows itself (grouped rows, a fixed last group).
export function pageMockList<T>(params: URLSearchParams, rows: T[]): ResponseWithPaginationUtil<T> {
  const page = Number(params.get(ApiUrlParamsUtil.page) ?? DEFAULT_PAGE);
  const size = Number(params.get(ApiUrlParamsUtil.pageSize) ?? DEFAULT_PAGE_SIZE);

  return {
    data: rows.slice((page - 1) * size, page * size),
    totalResultNumber: rows.length,
    currentPage: page,
  };
}
