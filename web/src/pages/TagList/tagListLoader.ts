import { DEFAULT_FIRST_PAGE } from '@app-types/utility';
import tagService, { DEFAULT_TAG_SORT_FIELD } from '@services/tagService/tagService';
import { ITEM_OPTIONS_PAGE_SIZE } from '@utils/itemListUtils';

export async function loader() {
  const tagsResponse = await tagService.getTags({
    pagination: { page: DEFAULT_FIRST_PAGE, size: ITEM_OPTIONS_PAGE_SIZE },
    sortingField: DEFAULT_TAG_SORT_FIELD,
  });

  return { tags: tagsResponse.data };
}
