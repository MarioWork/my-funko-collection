import { redirect, type ActionFunctionArgs } from 'react-router';
import type { AuthSessionApiModel } from '@app-types/models';
import type { JSONResponseUtil } from '@app-types/utility';
import { AUTH_ROUTES_PATHS, defaultRedirectRoute } from '@application/routes/routesUtils';
import { forgetSignedInUser } from '@application/routes/signedInUserMiddleware';
import authService from '@services/authService/authService';
import { SetPasswordSchema } from '@services/authService/authService.type';
import { failWhenInvalid } from '@utils/actionUtils';
import { parseFormData } from '@utils/formDataUtils';
import { SetPasswordIntents, type SetPasswordFormData } from './setPasswordUtils';

type SetPasswordResult = JSONResponseUtil<AuthSessionApiModel> | JSONResponseUtil | Response;

type IntentAction = (formData: SetPasswordFormData) => Promise<SetPasswordResult>;

// The new password replaces the temporary one, under the username the admin gave. The API answers the user with
// mustChangePassword off, so the app opens.
async function saveOwnPassword({ credentials }: SetPasswordFormData): Promise<SetPasswordResult> {
  const fields = await SetPasswordSchema.validate(credentials);
  const result = await authService.setPassword(fields);

  if (!result.success) return result;

  forgetSignedInUser();

  return redirect(defaultRedirectRoute);
}

// Public on the API (204 even for an expired session): only a request that never got an answer fails here. The
// app shell's own sign-out route would send this user back here first, so the page signs out itself.
async function signOut(): Promise<SetPasswordResult> {
  const result = await authService.logout();

  if (!result.success) return result;

  forgetSignedInUser();

  return redirect(AUTH_ROUTES_PATHS.LOGIN);
}

const INTENT_ACTION_MAP: Record<SetPasswordIntents, IntentAction> = {
  [SetPasswordIntents.SAVE]: saveOwnPassword,
  [SetPasswordIntents.SIGN_OUT]: signOut,
};

export const setOwnPasswordAction = async ({ request }: ActionFunctionArgs): Promise<SetPasswordResult> => {
  const formData = parseFormData<SetPasswordFormData>(await request.formData());
  const intentAction = INTENT_ACTION_MAP[formData.intent] ?? INTENT_ACTION_MAP[SetPasswordIntents.SAVE];

  return failWhenInvalid(() => intentAction(formData));
};
