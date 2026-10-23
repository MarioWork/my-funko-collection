import type { AuthSessionApiModel } from '@app-types/models';
import type { JSONResponseUtil } from '@app-types/utility';
import authService from '@services/authService/authService';
import { FinishLoginSchema } from '@services/authService/authService.type';
import { getPasskey } from '@utils/passkeyUtils';

// The whole passkey sign-in, for a route action: options from the API, the browser's prompt, then the check. It
// signs in from the login page and confirms it's you before a sensitive change (removing a passkey). A cancelled
// prompt comes back as a failure with a PasskeyCeremonyFailureUtil code, the same shape as the API's own failures.
export async function signInWithPasskey(): Promise<JSONResponseUtil<AuthSessionApiModel>> {
  const options = await authService.startLogin();

  if (!options.success || !options.data) return { success: false, error: options.error };

  const ceremony = await getPasskey(options.data);

  if ('failure' in ceremony) return { success: false, error: { code: ceremony.failure } };

  const fields = await FinishLoginSchema.validate({ response: ceremony.response });

  return authService.finishLogin(fields);
}

// "Confirm it's you": adding or removing a passkey needs a sign-in from the last 10 minutes (else the API answers
// 403 REAUTH_REQUIRED). After that answer the dialog submits again with `isReauth`, and the write runs behind a
// fresh passkey sign-in. A failed or cancelled sign-in is returned as is, and the write is not attempted.
export async function withFreshSignIn<T>(
  isReauth: boolean,
  write: () => Promise<JSONResponseUtil<T>>,
): Promise<JSONResponseUtil<T>> {
  if (!isReauth) return write();

  const signIn = await signInWithPasskey();

  if (!signIn.success) return { success: false, error: signIn.error };

  return write();
}
