import type { NamedApiModel } from './namedApiModel.type';
import type { PossibleDoubleApiModel } from './possibleDoubleApiModel.type';
import type { SubmissionApiModel } from './submissionApiModel.type';

// A submission as an admin reviews it (GET /submissions/review): who sent it in (null for a removed user) and,
// while it waits, the funkos it may be a double of.
export interface ReviewSubmissionApiModel extends SubmissionApiModel {
  submittedBy: NamedApiModel | null;
  possibleDoubles: PossibleDoubleApiModel[];
}
