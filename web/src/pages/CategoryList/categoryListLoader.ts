import { DEFAULT_FIRST_PAGE } from '@app-types/utility';
import categoryService, { DEFAULT_CATEGORY_SORT_FIELD } from '@services/categoryService/categoryService';
import { ITEM_OPTIONS_PAGE_SIZE } from '@utils/itemListUtils';

export async function loader() {
  const categoriesResponse = await categoryService.getCategories({
    pagination: { page: DEFAULT_FIRST_PAGE, size: ITEM_OPTIONS_PAGE_SIZE },
    sortingField: DEFAULT_CATEGORY_SORT_FIELD,
  });

  return { categories: categoriesResponse.data };
}
