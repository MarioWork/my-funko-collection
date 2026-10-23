import { isNextPageRequest } from '@utils/infiniteListUtils';
import { getAllCategories, getAllCollections, getAllSeries, getAllTags } from '@api/optionLists';
import type { LoaderFunctionArgs } from 'react-router';
import { ApiUrlParamsUtil, DEFAULT_FIRST_PAGE, SortingDirectionUtil } from '@app-types/utility';
import funkoService, {
  FunkoApiSearchFields,
  FunkoApiSortingFields,
  type GetFunkosFields,
} from '@services/funkoService/funkoService';
import { FUNKO_PAGE_SIZE } from './funkoListUtils';

const SORT_FIELDS = new Set<string>(Object.values(FunkoApiSortingFields));
const DIRECTIONS = new Set<string>(Object.values(SortingDirectionUtil));

type SearchFields = Partial<Record<FunkoApiSearchFields, string>>;

function readSearchFields(searchParams: URLSearchParams): SearchFields {
  const fields: SearchFields = {};

  for (const field of Object.values(FunkoApiSearchFields)) {
    const value = searchParams.get(field);

    if (value) fields[field] = value;
  }

  return fields;
}

type FunkoSort = { field: FunkoApiSortingFields; direction: SortingDirectionUtil };

const SEARCH_DEFAULT_SORT: FunkoSort = { field: FunkoApiSortingFields.RELEVANCE, direction: SortingDirectionUtil.ASC };
const BROWSE_DEFAULT_SORT: FunkoSort = {
  field: FunkoApiSortingFields.CREATION_DATE,
  direction: SortingDirectionUtil.DESC,
};

// Best match when there is a query, newest first otherwise, unless the URL says which sort it wants.
function resolveSort(sortParam: string, directionParam: string, hasQuery: boolean): FunkoSort {
  const defaultSort = hasQuery ? SEARCH_DEFAULT_SORT : BROWSE_DEFAULT_SORT;

  if (!SORT_FIELDS.has(sortParam)) return defaultSort;

  const direction = DIRECTIONS.has(directionParam)
    ? (directionParam as SortingDirectionUtil)
    : SortingDirectionUtil.ASC;

  return { field: sortParam as FunkoApiSortingFields, direction };
}

// Reads the list state from the URL and loads the page plus the options the filter panel offers.
export async function loader({ request }: LoaderFunctionArgs) {
  const searchParams = new URL(request.url).searchParams;
  const searchFields = readSearchFields(searchParams);
  const sort = resolveSort(
    searchParams.get(ApiUrlParamsUtil.sorting_fields) ?? '',
    searchParams.get(ApiUrlParamsUtil.sortingDirection) ?? '',
    Boolean(searchFields[FunkoApiSearchFields.QUERY]),
  );
  const page = searchParams.get(ApiUrlParamsUtil.page) ?? DEFAULT_FIRST_PAGE;

  const fields: GetFunkosFields = {
    pagination: { page, size: FUNKO_PAGE_SIZE },
    sortingField: sort.field,
    direction: sort.direction,
    ...searchFields,
  };

  // The next page of the infinite list needs the funkos only; the filters' lists are already on screen.
  const isNextPage = isNextPageRequest(request);
  const noOptions = Promise.resolve([]);
  const [funkosResponse, categories, series, collections, tags] = await Promise.all([
    funkoService.getFunkos(fields),
    isNextPage ? noOptions : getAllCategories(),
    isNextPage ? noOptions : getAllSeries(),
    isNextPage ? noOptions : getAllCollections(),
    isNextPage ? noOptions : getAllTags(),
  ]);

  return {
    funkosResponse,
    categories,
    series,
    collections,
    tags,
    sort,
    page: Number(page),
    pageSize: Number(FUNKO_PAGE_SIZE),
  };
}
