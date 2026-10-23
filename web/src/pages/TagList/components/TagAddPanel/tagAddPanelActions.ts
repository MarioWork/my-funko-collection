import type { ActionFunctionArgs } from 'react-router';
import { ValidationError } from 'yup';
import type { TagApiModel } from '@app-types/models';
import type { JSONResponseUtil } from '@app-types/utility';
import type { ManageEntityFormData } from '@components/ManageForm';
import tagService from '@services/tagService/tagService';
import { CreateTagSchema } from '@services/tagService/tagService.type';
import { parseFormData } from '@utils/formDataUtils';
import { toTagPayload } from '../../tagListUtils';

export const createTagAction = async ({ request }: ActionFunctionArgs): Promise<JSONResponseUtil<TagApiModel>> => {
  const formData = parseFormData<ManageEntityFormData>(await request.formData());

  try {
    const valid = await CreateTagSchema.validate(toTagPayload(formData));

    return await tagService.addTag(valid);
  } catch (error) {
    if (error instanceof ValidationError) return { success: false };

    throw error;
  }
};
