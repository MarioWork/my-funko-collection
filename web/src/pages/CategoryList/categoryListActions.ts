import type { ActionFunctionArgs } from 'react-router';
import { ValidationError } from 'yup';
import type { CategoryApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import type { ManageEntityFormData } from '@components/ManageForm';
import categoryService from '@services/categoryService/categoryService';
import { CreateCategorySchema, UpdateCategorySchema } from '@services/categoryService/categoryService.type';
import { parseFormData } from '@utils/formDataUtils';

export const createCategoryAction = async ({
  request,
}: ActionFunctionArgs): Promise<JSONResponseUtil<CategoryApiModel>> => {
  const { entity } = parseFormData<ManageEntityFormData>(await request.formData());

  try {
    const valid = await CreateCategorySchema.validate({ name: entity.name });

    return await categoryService.addCategory(valid);
  } catch (error) {
    if (error instanceof ValidationError) return { success: false };

    throw error;
  }
};

const updateCategoryAction = async ({
  request,
  params,
}: ActionFunctionArgs): Promise<JSONResponseUtil<CategoryApiModel>> => {
  const { entity } = parseFormData<ManageEntityFormData>(await request.formData());

  try {
    const valid = await UpdateCategorySchema.validate({ name: entity.name });

    return await categoryService.updateCategory(Number(params.categoryId), valid);
  } catch (error) {
    if (error instanceof ValidationError) return { success: false };

    throw error;
  }
};

const deleteCategoryAction = async ({ params }: ActionFunctionArgs): Promise<JSONResponseUtil> =>
  categoryService.deleteCategory(Number(params.categoryId));

const CATEGORY_ACTION_MAP: Record<string, (args: ActionFunctionArgs) => Promise<JSONResponseUtil>> = {
  [HttpVerbsUtil.PATCH]: updateCategoryAction,
  [HttpVerbsUtil.DELETE]: deleteCategoryAction,
};

// One path, two verbs: PATCH renames, DELETE removes.
export const categoryAction = async (args: ActionFunctionArgs): Promise<JSONResponseUtil> => {
  const handler = CATEGORY_ACTION_MAP[args.request.method];

  if (!handler) return { success: false };

  return handler(args);
};
