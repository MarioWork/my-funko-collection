import type { ActionFunctionArgs } from 'react-router';
import type { SubmissionApiModel } from '@app-types/models';
import type { JSONResponseUtil } from '@app-types/utility';
import submissionService from '@services/submissionService/submissionService';

// The sender sends a rejected submission in again, after fixing it (or as it was).
export const resendSubmissionAction = async ({
  params,
}: ActionFunctionArgs): Promise<JSONResponseUtil<SubmissionApiModel>> =>
  submissionService.resendSubmission(Number(params.funkoId));
