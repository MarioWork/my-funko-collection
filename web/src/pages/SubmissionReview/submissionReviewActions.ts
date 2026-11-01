import type { ActionFunctionArgs } from 'react-router';
import type { SubmissionApiModel } from '@app-types/models';
import type { JSONResponseUtil } from '@app-types/utility';
import submissionService from '@services/submissionService/submissionService';
import { RejectSubmissionSchema } from '@services/submissionService/submissionService.type';
import { failWhenInvalid } from '@utils/actionUtils';
import { assertAdmin } from '@utils/adminRouteUtils';
import { parseFormData } from '@utils/formDataUtils';
import type { RejectSubmissionFormData } from './submissionReviewUtils';

// Admins only: the waiting funko joins the catalogue for everyone.
export const approveSubmissionAction = async ({
  params,
  context,
}: ActionFunctionArgs): Promise<JSONResponseUtil<SubmissionApiModel>> => {
  assertAdmin(context);

  return submissionService.approveSubmission(Number(params.funkoId));
};

// Admins only: turned down, with a reason its sender reads.
export const rejectSubmissionAction = async ({
  request,
  params,
  context,
}: ActionFunctionArgs): Promise<JSONResponseUtil<SubmissionApiModel>> => {
  assertAdmin(context);

  const { rejection } = parseFormData<RejectSubmissionFormData>(await request.formData());

  return failWhenInvalid(async () => {
    const fields = await RejectSubmissionSchema.validate(rejection);

    return submissionService.rejectSubmission(Number(params.funkoId), fields);
  });
};
