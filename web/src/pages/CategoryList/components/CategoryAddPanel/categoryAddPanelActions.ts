import type { ActionFunctionArgs } from 'react-router';
import type { CategoryApiModel } from '@app-types/models';
import type { JSONResponseUtil } from '@app-types/utility';
import type { ManageEntityFormData } from '@components/ManageForm';
import categoryService from '@services/categoryService/categoryService';
import { CreateCategorySchema } from '@services/categoryService/categoryService.type';
import { parseFormData } from '@utils/formDataUtils';
import { failWhenInvalid } from '@utils/actionUtils';

export const createCategoryAction = async ({
  request,
}: ActionFunctionArgs): Promise<JSONResponseUtil<CategoryApiModel>> => {
  const { entity } = parseFormData<ManageEntityFormData>(await request.formData());

  return failWhenInvalid(async () => {
    const valid = await CreateCategorySchema.validate({ name: entity.name });

    return categoryService.addCategory(valid);
  });
};
