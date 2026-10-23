import type { ApiError } from '@app-types/models';
import { PasskeyCeremonyFailureUtil, type AuthFailureMessagesUtil } from '@app-types/utility';
import { AuthApiErrorCodes } from '@services/authService/authService';
import { GENERIC_WRITE_ERROR } from '@utils/errorMessageUtils';

const TOO_MANY_REQUESTS_STATUS = 429;

// What every passkey step can run into, whichever page it is on. Pages add or override their own.
const COMMON_AUTH_FAILURE_MESSAGES: AuthFailureMessagesUtil = {
  [PasskeyCeremonyFailureUtil.CANCELLED]: "No worries, the passkey prompt was closed. Try again when you're ready.",
  [PasskeyCeremonyFailureUtil.FAILED]: "Your browser couldn't use a passkey just now. Try again in a moment.",
  [AuthApiErrorCodes.TOO_MANY_REQUESTS]: 'Too many tries in a row. Take a short break and try again in a minute.',
  [AuthApiErrorCodes.PASSKEY_FAILED]: "That passkey couldn't be checked. Try again.",
};

// The rate limit answers 429 whatever its exact code, so the status decides.
function failureCodeOf(error: ApiError | undefined): string | undefined {
  if (error?.statusCode === TOO_MANY_REQUESTS_STATUS) return AuthApiErrorCodes.TOO_MANY_REQUESTS;

  return error?.code;
}

export function authFailureMessage(error: ApiError | undefined, messages: AuthFailureMessagesUtil): string {
  const code = failureCodeOf(error);
  const pageMessage = code ? messages[code] : undefined;
  const commonMessage = code ? COMMON_AUTH_FAILURE_MESSAGES[code] : undefined;

  return pageMessage ?? commonMessage ?? error?.message ?? GENERIC_WRITE_ERROR;
}
