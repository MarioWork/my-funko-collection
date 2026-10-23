import { HttpResponse } from 'msw/http';
import { errorResponse } from '@mocks/mockResponses';
import { mockStore } from '@mocks/mockStore';
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

const NO_CONTENT_STATUS = 204;

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

export const noContent = (): Response => new HttpResponse(null, { status: NO_CONTENT_STATUS });

export const unauthorized = (): Response => errorResponse(401, 'UNAUTHORIZED', 'Sign in to continue.');

// Adding and removing a passkey need a sign-in from the last 10 minutes.
export function reauthRequiredResponse(): Response | undefined {
  if (mockStore.auth.isSignInRecent) return undefined;

  return errorResponse(403, AuthApiErrorCodes.REAUTH_REQUIRED, 'Sign in again to change your passkeys.');
}
