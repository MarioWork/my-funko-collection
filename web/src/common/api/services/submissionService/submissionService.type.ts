import { object, type InferType } from 'yup';
import { rejectionReasonSchema } from '@utils/submissionUtils';

// An admin rejects a submission with a reason its sender reads.
export const RejectSubmissionSchema = object({
  reason: rejectionReasonSchema,
});

export type RejectSubmission = InferType<typeof RejectSubmissionSchema>;
