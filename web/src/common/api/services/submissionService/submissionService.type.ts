import { number, object, type InferType } from 'yup';
import { rejectionReasonSchema } from '@utils/submissionUtils';

// An admin rejects a submission with a reason its sender reads.
export const RejectSubmissionSchema = object({
  reason: rejectionReasonSchema,
});

export type RejectSubmission = InferType<typeof RejectSubmissionSchema>;

// An admin merges a submission into the catalogue funko it is the same as.
export const MergeSubmissionSchema = object({
  targetFunkoId: number().integer().positive().required(),
});

export type MergeSubmission = InferType<typeof MergeSubmissionSchema>;
