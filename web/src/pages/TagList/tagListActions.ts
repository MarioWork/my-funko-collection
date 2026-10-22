import type { ActionFunctionArgs } from 'react-router';
import { ValidationError } from 'yup';
import type { TagApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import type { ManageEntityFormData } from '@components/ManageList/manageListUtils';
import tagService from '@services/tagService/tagService';
import { CreateTagSchema, UpdateTagSchema } from '@services/tagService/tagService.type';
import { parseFormData } from '@utils/formDataUtils';

const toTagPayload = ({ entity }: ManageEntityFormData) => ({
  name: entity.name,
  notes: entity.notes ? entity.notes : null,
});

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

const updateTagAction = async ({ request, params }: ActionFunctionArgs): Promise<JSONResponseUtil<TagApiModel>> => {
  const formData = parseFormData<ManageEntityFormData>(await request.formData());

  try {
    const valid = await UpdateTagSchema.validate(toTagPayload(formData));

    return await tagService.updateTag(Number(params.tagId), valid);
  } catch (error) {
    if (error instanceof ValidationError) return { success: false };

    throw error;
  }
};

const deleteTagAction = async ({ params }: ActionFunctionArgs): Promise<JSONResponseUtil> =>
  tagService.deleteTag(Number(params.tagId));

const TAG_ACTION_MAP: Record<string, (args: ActionFunctionArgs) => Promise<JSONResponseUtil>> = {
  [HttpVerbsUtil.PATCH]: updateTagAction,
  [HttpVerbsUtil.DELETE]: deleteTagAction,
};

// One path, two verbs: PATCH renames, DELETE removes the label from every item.
export const tagAction = async (args: ActionFunctionArgs): Promise<JSONResponseUtil> => {
  const handler = TAG_ACTION_MAP[args.request.method];

  if (!handler) return { success: false };

  return handler(args);
};
