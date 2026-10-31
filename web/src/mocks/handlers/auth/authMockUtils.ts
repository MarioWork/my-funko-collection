import { UNAUTHORIZED_ERROR_CODE } from '@api/axiosActions';
import { errorResponse } from '@mocks/mockResponses';
import { FORBIDDEN_STATUS, UNAUTHORIZED_STATUS } from '@utils/httpStatusUtils';
import { mockStore } from '@mocks/mockStore';
import type { AuthUserApiModel } from '@app-types/models';
import type { MockAuth } from '@mocks/mockStore.type';
import { AuthApiErrorCodes } from '@services/authService/authService';

// The parts of a WebAuthn response the mocks check: what the browser library always sends. The real API verifies
// the signature; the mocks accept any well-formed answer.
type CeremonyResponse = {
  id: string;
  response: object;
};

type CeremonyBody = {
  response?: unknown;
};

export function isCeremonyResponse(value: unknown): value is CeremonyResponse {
  if (typeof value !== 'object' || value === null) return false;

  const hasId = 'id' in value && typeof value.id === 'string' && value.id !== '';
  const hasResponse = 'response' in value && typeof value.response === 'object' && value.response !== null;

  return hasId && hasResponse;
}

export async function readCeremonyResponse(request: Request): Promise<CeremonyResponse | undefined> {
  const body = (await request.json()) as CeremonyBody;

  return isCeremonyResponse(body.response) ? body.response : undefined;
}

export function rpIdOf(request: Request): string {
  return new URL(request.url).hostname;
}

// The user as the API describes them in a sign-in or status answer.
export function mockUserOf({ userName, username, role, mustChangePassword }: MockAuth): AuthUserApiModel {
  return { name: userName, username, role, mustChangePassword };
}

export const unauthorized = (): Response =>
  errorResponse(UNAUTHORIZED_STATUS, UNAUTHORIZED_ERROR_CODE, 'Sign in to continue.');

// Adding and removing a passkey need a sign-in from the last 10 minutes.
export function reauthRequiredResponse(): Response | undefined {
  if (mockStore.auth.isSignInRecent) return undefined;

  return errorResponse(FORBIDDEN_STATUS, AuthApiErrorCodes.REAUTH_REQUIRED, 'Confirm it’s you first.');
}
