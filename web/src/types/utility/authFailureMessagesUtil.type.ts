// Friendly copy for a failed passkey step, keyed by the failure's code: an API code (AuthApiErrorCodes) or a
// browser ceremony code (PasskeyCeremonyFailureUtil). Never the raw browser error.
export type AuthFailureMessagesUtil = Partial<Record<string, string>>;
