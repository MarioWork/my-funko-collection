import {
  browserSupportsWebAuthn,
  startAuthentication,
  startRegistration,
  type AuthenticationResponseJSON,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
  type RegistrationResponseJSON,
} from '@simplewebauthn/browser';
import { PasskeyCeremonyFailureUtil } from '@app-types/utility';

type PasskeyCeremonyResult<Response> = { response: Response } | { failure: PasskeyCeremonyFailureUtil };

// DOMException names from navigator.credentials, which @simplewebauthn/browser keeps on its WebAuthnError.
const FAILURE_BY_ERROR_NAME: Record<string, PasskeyCeremonyFailureUtil> = {
  NotAllowedError: PasskeyCeremonyFailureUtil.CANCELLED,
  AbortError: PasskeyCeremonyFailureUtil.CANCELLED,
  InvalidStateError: PasskeyCeremonyFailureUtil.ALREADY_REGISTERED,
};

function failureOf(error: unknown): PasskeyCeremonyFailureUtil {
  if (!(error instanceof Error)) return PasskeyCeremonyFailureUtil.FAILED;

  return FAILURE_BY_ERROR_NAME[error.name] ?? PasskeyCeremonyFailureUtil.FAILED;
}

export function isPasskeySupported(): boolean {
  return browserSupportsWebAuthn();
}

// Signing in: the browser shows its passkey prompt (Face ID, Touch ID, a passkey manager) for the given options.
export async function getPasskey(
  optionsJSON: PublicKeyCredentialRequestOptionsJSON,
): Promise<PasskeyCeremonyResult<AuthenticationResponseJSON>> {
  try {
    return { response: await startAuthentication({ optionsJSON }) };
  } catch (error) {
    return { failure: failureOf(error) };
  }
}

// Registering: the browser asks where to save a new passkey for the given options.
export async function createPasskey(
  optionsJSON: PublicKeyCredentialCreationOptionsJSON,
): Promise<PasskeyCeremonyResult<RegistrationResponseJSON>> {
  try {
    return { response: await startRegistration({ optionsJSON }) };
  } catch (error) {
    return { failure: failureOf(error) };
  }
}
