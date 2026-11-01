import { array, mixed, number, object, type InferType } from 'yup';
import { rejectionReasonSchema } from '@utils/submissionUtils';
import { SubmissionApiMergeFields } from './submissionService';

// An admin rejects a submission with a reason its sender reads.
export const RejectSubmissionSchema = object({
  reason: rejectionReasonSchema,
});

export type RejectSubmission = InferType<typeof RejectSubmissionSchema>;

const imageIdsSchema = array(number().integer().positive().required()).required();

// An admin merges a submission into the catalogue funko it is the same as, and picks what that funko keeps: the
// fields it takes from the submission, the submission's images that move onto it, and its own images that go.
export const MergeSubmissionSchema = object({
  targetFunkoId: number().integer().positive().required(),
  fieldsFromSubmission: array(
    mixed<SubmissionApiMergeFields>().oneOf(Object.values(SubmissionApiMergeFields)).required(),
  ).required(),
  imageIdsFromSubmission: imageIdsSchema,
  removedImageIds: imageIdsSchema,
});

export type MergeSubmission = InferType<typeof MergeSubmissionSchema>;
