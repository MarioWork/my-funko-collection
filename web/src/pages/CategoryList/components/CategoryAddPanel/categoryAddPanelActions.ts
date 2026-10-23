import type { ActionFunctionArgs } from 'react-router';
import { ValidationError } from 'yup';
import type { CategoryApiModel } from '@app-types/models';
import type { JSONResponseUtil } from '@app-types/utility';
import type { ManageEntityFormData } from '@components/ManageForm';
import categoryService from '@services/categoryService/categoryService';
import { CreateCategorySchema } from '@services/categoryService/categoryService.type';
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
