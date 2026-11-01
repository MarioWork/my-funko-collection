import type { DoubleMatchFieldUtil, SubmissionStatusUtil } from '@app-types/utility';

// Another approved or waiting funko a waiting submission may be a double of, and why. `isChase` and `exclusive` ("" for
// a regular release) tell a regular and a chase of the same number and name apart.
export interface PossibleDoubleApiModel {
  id: number;
  name: string;
  number: string;
  isChase: boolean;
  exclusive: string;
  status: SubmissionStatusUtil;
  matchedOn: DoubleMatchFieldUtil[];
}
