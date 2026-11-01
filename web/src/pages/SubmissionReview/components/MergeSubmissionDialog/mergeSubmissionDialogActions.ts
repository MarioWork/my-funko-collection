import type { ActionFunctionArgs } from 'react-router';
import type { SubmissionApiModel } from '@app-types/models';
import type { JSONResponseUtil } from '@app-types/utility';
import submissionService from '@services/submissionService/submissionService';
import { MergeSubmissionSchema } from '@services/submissionService/submissionService.type';
import { failWhenInvalid } from '@utils/actionUtils';
import { assertAdmin } from '@utils/adminRouteUtils';
import { parseFormData } from '@utils/formDataUtils';
import type { MergeSubmissionFormData } from './mergeSubmissionDialogUtils';

// Admins only: the same funko as one in the catalogue; the sender's items move onto it, and it keeps the picked
// fields and images.
export const mergeSubmissionAction = async ({
  request,
  params,
  context,
}: ActionFunctionArgs): Promise<JSONResponseUtil<SubmissionApiModel>> => {
  assertAdmin(context);

  const { merge } = parseFormData<MergeSubmissionFormData>(await request.formData());

  return failWhenInvalid(async () => {
    const fields = await MergeSubmissionSchema.validate(merge);

    return submissionService.mergeSubmission(Number(params.funkoId), fields);
  });
};
