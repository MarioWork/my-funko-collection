import type { ActionFunctionArgs } from 'react-router';
import type { CategoryApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import type { ManageEntityFormData } from '@components/ManageForm';
import categoryService from '@services/categoryService/categoryService';
import { UpdateCategorySchema } from '@services/categoryService/categoryService.type';
import { parseFormData } from '@utils/formDataUtils';
import { actionForVerbs, failWhenInvalid, type VerbActionMap } from '@utils/actionUtils';

const updateCategoryAction = async ({
  request,
  params,
}: ActionFunctionArgs): Promise<JSONResponseUtil<CategoryApiModel>> => {
  const { entity } = parseFormData<ManageEntityFormData>(await request.formData());

  return failWhenInvalid(async () => {
    const valid = await UpdateCategorySchema.validate({ name: entity.name });

    return categoryService.updateCategory(Number(params.categoryId), valid);
  });
};

const deleteCategoryAction = async ({ params }: ActionFunctionArgs): Promise<JSONResponseUtil> =>
  categoryService.deleteCategory(Number(params.categoryId));

const CATEGORY_ACTION_MAP: VerbActionMap = {
  [HttpVerbsUtil.PATCH]: updateCategoryAction,
  [HttpVerbsUtil.DELETE]: deleteCategoryAction,
};

// One path, two verbs: PATCH renames, DELETE removes.
export const categoryAction = actionForVerbs(CATEGORY_ACTION_MAP);
