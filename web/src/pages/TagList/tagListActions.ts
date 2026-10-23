import type { ActionFunctionArgs } from 'react-router';
import { ValidationError } from 'yup';
import type { TagApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import type { ManageEntityFormData } from '@components/ManageForm';
import tagService from '@services/tagService/tagService';
import { UpdateTagSchema } from '@services/tagService/tagService.type';
import { parseFormData } from '@utils/formDataUtils';
import { toTagPayload } from './tagListUtils';

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

type VerbAction = (args: ActionFunctionArgs) => Promise<JSONResponseUtil>;

const TAG_ACTION_MAP: Record<string, VerbAction> = {
  [HttpVerbsUtil.PATCH]: updateTagAction,
  [HttpVerbsUtil.DELETE]: deleteTagAction,
};

// One path, two verbs: PATCH renames, DELETE removes the label from every item.
export const tagAction = async (args: ActionFunctionArgs): Promise<JSONResponseUtil> => {
  const handler = TAG_ACTION_MAP[args.request.method];

  if (!handler) return { success: false };

  return handler(args);
};
