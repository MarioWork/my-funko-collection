import type { SubmissionStatusUtil } from '@app-types/utility';
import type { FunkoSummaryApiModel } from './funkoSummaryApiModel.type';

// One funko the signed-in user sent in (GET /submissions), with where it stands; `createdAt` is when they sent it.
// `reviewedAt`: when an admin last approved or rejected it (kept when a rejected one is sent again);
// `rejectionReason` while it is rejected; `changedByAdminAt`: when an admin last changed it before approving it.
export interface SubmissionApiModel extends FunkoSummaryApiModel {
  status: SubmissionStatusUtil;
  reviewedAt: string | null;
  rejectionReason: string | null;
  changedByAdminAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type SubmissionId = SubmissionApiModel['id'];
