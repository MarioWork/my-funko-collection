import type { ActionFunctionArgs } from 'react-router';
import type { TagApiModel } from '@app-types/models';
import type { JSONResponseUtil } from '@app-types/utility';
import type { ManageEntityFormData } from '@components/ManageForm';
import tagService from '@services/tagService/tagService';
import { CreateTagSchema } from '@services/tagService/tagService.type';
import { parseFormData } from '@utils/formDataUtils';
import { toTagPayload } from '../../tagListUtils';
import { failWhenInvalid } from '@utils/actionUtils';

export const createTagAction = async ({ request }: ActionFunctionArgs): Promise<JSONResponseUtil<TagApiModel>> => {
  const formData = parseFormData<ManageEntityFormData>(await request.formData());

  return failWhenInvalid(async () => {
    const valid = await CreateTagSchema.validate(toTagPayload(formData));

    return tagService.addTag(valid);
  });
};
