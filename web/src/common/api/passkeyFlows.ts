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
