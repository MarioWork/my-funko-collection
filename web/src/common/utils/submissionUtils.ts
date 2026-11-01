import { string } from 'yup';

// As the API caps it.
export const REJECTION_REASON_MAX_LENGTH = 500;

// Why an admin rejects a submission: the sender reads it, so it is required.
export const rejectionReasonSchema = string()
  .trim()
  .required('Say why, so the member can fix it')
  .max(REJECTION_REASON_MAX_LENGTH, `Keep it under ${REJECTION_REASON_MAX_LENGTH} characters`);

// The note a sender reads once an admin changed what they sent in.
export const CHANGED_BY_ADMIN_NOTE = 'An admin changed this submission.';
