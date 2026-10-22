import type { LoaderFunctionArgs } from 'react-router';
import { DEFAULT_FIRST_PAGE } from '@app-types/utility';
import categoryService, { DEFAULT_CATEGORY_SORT_FIELD } from '@services/categoryService/categoryService';
import funkoService from '@services/funkoService/funkoService';

const CATEGORIES_PAGE_SIZE = '100';

export async function loader({ params }: LoaderFunctionArgs) {
  const [funko, categoriesResponse] = await Promise.all([
    funkoService.getFunko(Number(params.funkoId)),
    categoryService.getCategories({
      pagination: { page: DEFAULT_FIRST_PAGE, size: CATEGORIES_PAGE_SIZE },
      sortingField: DEFAULT_CATEGORY_SORT_FIELD,
    }),
  ]);

  return { funko, categories: categoriesResponse.data };
}
