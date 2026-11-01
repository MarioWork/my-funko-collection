// Submissions: a member's own list, the admins' review list, and approving, rejecting, merging and sending again. The rows
// are funkos, so the funkos service does the work; this module owns no table.
import type { SignedInUser } from '../auth/auth.type.ts';
import {
  approveSubmission as approveFunkoSubmission,
  getReviewSubmissions as getFunkoReviewSubmissions,
  getSubmittedFunkos,
  mergeSubmission as mergeFunkoSubmission,
  rejectSubmission as rejectFunkoSubmission,
  resendSubmission as resendFunkoSubmission,
} from '../funkos/funkos.service.ts';
import type { MergeSubmission } from './submissions.schema.ts';
import type {
  ListReviewQuery,
  ListSubmissionsQuery,
  RejectionOutcome,
  ReviewSubmissionListResponse,
  SubmissionListResponse,
  SubmissionResponse,
} from './submissions.type.ts';

export async function getSubmissions(userId: number, query: ListSubmissionsQuery): Promise<SubmissionListResponse> {
  return getSubmittedFunkos(userId, query);
}

export async function getReviewSubmissions(query: ListReviewQuery): Promise<ReviewSubmissionListResponse> {
  return getFunkoReviewSubmissions(query);
}

export async function approveSubmission(funkoId: number): Promise<SubmissionResponse> {
  return approveFunkoSubmission(funkoId);
}

export async function rejectSubmission(funkoId: number, reason: string): Promise<RejectionOutcome> {
  return rejectFunkoSubmission(funkoId, reason);
}

export async function mergeSubmission(funkoId: number, choices: MergeSubmission): Promise<SubmissionResponse> {
  return mergeFunkoSubmission(funkoId, choices);
}

export async function resendSubmission(user: SignedInUser, funkoId: number): Promise<SubmissionResponse> {
  return resendFunkoSubmission(user, funkoId);
}
