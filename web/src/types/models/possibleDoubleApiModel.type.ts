import type { DoubleMatchFieldUtil, SubmissionStatusUtil } from '@app-types/utility';

// Another approved or waiting funko a waiting submission may be a double of, and why.
export interface PossibleDoubleApiModel {
  id: number;
  name: string;
  number: string;
  status: SubmissionStatusUtil;
  matchedOn: DoubleMatchFieldUtil[];
}
