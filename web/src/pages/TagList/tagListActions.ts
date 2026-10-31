import type { ActionFunctionArgs } from 'react-router';
import type { TagApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import type { ManageEntityFormData } from '@components/ManageForm';
import tagService from '@services/tagService/tagService';
import { UpdateTagSchema } from '@services/tagService/tagService.type';
import { parseFormData } from '@utils/formDataUtils';
import { toTagPayload } from './tagListUtils';
import { actionForVerbs, failWhenInvalid, type VerbActionMap } from '@utils/actionUtils';

const updateTagAction = async ({ request, params }: ActionFunctionArgs): Promise<JSONResponseUtil<TagApiModel>> => {
  const formData = parseFormData<ManageEntityFormData>(await request.formData());

  return failWhenInvalid(async () => {
    const valid = await UpdateTagSchema.validate(toTagPayload(formData));

    return tagService.updateTag(Number(params.tagId), valid);
  });
};

const deleteTagAction = async ({ params }: ActionFunctionArgs): Promise<JSONResponseUtil> =>
  tagService.deleteTag(Number(params.tagId));

const TAG_ACTION_MAP: VerbActionMap = {
  [HttpVerbsUtil.PATCH]: updateTagAction,
  [HttpVerbsUtil.DELETE]: deleteTagAction,
};

// One path, two verbs: PATCH renames, DELETE removes the label from every item.
export const tagAction = actionForVerbs(TAG_ACTION_MAP);
