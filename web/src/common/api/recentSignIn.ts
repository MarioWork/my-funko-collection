import type { AuthSessionApiModel } from '@app-types/models';
import { ReauthMethodUtil, type JSONResponseUtil, type ReauthUtil } from '@app-types/utility';
import { signInWithPasskey } from '@api/passkeyFlows';
import { forgetSignedInUser } from '@application/routes/signedInUserMiddleware';
import authService from '@services/authService/authService';
import { ConfirmPasswordSchema } from '@services/authService/authService.type';

async function confirmWithPassword(password: string): Promise<JSONResponseUtil<AuthSessionApiModel>> {
  const fields = await ConfirmPasswordSchema.validate({ password });

  return authService.addRecentSignIn(fields);
}

async function renewRecentSignIn(reauth: ReauthUtil): Promise<JSONResponseUtil<AuthSessionApiModel>> {
  if (reauth.method === ReauthMethodUtil.PASSWORD) return confirmWithPassword(reauth.password);

  return signInWithPasskey();
}

// "Confirm it's you": changing a passkey or the password, or creating or changing a user, needs a sign-in from the
// last 10 minutes (else the API answers 403 REAUTH_REQUIRED). After that answer the dialog submits again with
// `reauth`, and the write runs behind a passkey sign-in or the user's own password. A failed or cancelled
// confirm is returned as is, and the write is not attempted.
export async function withRecentSignIn<T>(
  reauth: ReauthUtil | undefined,
  write: () => Promise<JSONResponseUtil<T>>,
): Promise<JSONResponseUtil<T>> {
  if (!reauth) return write();

  const signIn = await renewRecentSignIn(reauth);

  if (!signIn.success) return { success: false, error: signIn.error };

  // Renewing the recent sign-in replaces the session, and a passkey picked may be someone else's: ask who it is again.
  forgetSignedInUser();

  return write();
}
