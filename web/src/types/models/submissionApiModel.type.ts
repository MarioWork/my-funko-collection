import type { SubmissionStatusUtil } from '@app-types/utility';
import type { FunkoSummaryApiModel } from './funkoSummaryApiModel.type';
import type { NamedApiModel } from './namedApiModel.type';

// One funko the signed-in user sent in (GET /submissions), with where it stands; `createdAt` is when they sent it.
// `reviewedAt`: when an admin last approved, rejected or merged it (kept when a rejected one is sent again);
// `rejectionReason` while it is rejected; `changedByAdminAt`: when an admin last changed it before approving it;
// `mergedInto`: the catalogue funko a merged one went into (null otherwise, or once that funko was deleted).
export interface SubmissionApiModel extends FunkoSummaryApiModel {
  status: SubmissionStatusUtil;
  reviewedAt: string | null;
  rejectionReason: string | null;
  changedByAdminAt: string | null;
  mergedInto: NamedApiModel | null;
  createdAt: string;
  updatedAt: string;
}

export type SubmissionId = SubmissionApiModel['id'];
