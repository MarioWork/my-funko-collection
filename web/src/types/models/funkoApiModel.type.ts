import type { FunkoMatchFieldUtil, SubmissionStatusUtil } from '@app-types/utility';
import type { FunkoSummaryApiModel } from './funkoSummaryApiModel.type';
import type { NamedApiModel } from './namedApiModel.type';

export interface FunkoApiModel extends FunkoSummaryApiModel {
  collections: NamedApiModel[];
  // APPROVED: in the catalogue. Anything else is a submission only its sender (and admins) see.
  status: SubmissionStatusUtil;
  // The signed-in user sent it in: while it waits, they may change it and its images.
  isSubmittedByMe: boolean;
  matchedOn?: FunkoMatchFieldUtil[];
  createdAt: string;
  updatedAt: string;
}

export type FunkoId = FunkoApiModel['id'];
