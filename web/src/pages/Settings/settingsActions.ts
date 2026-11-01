import { redirect, type ActionFunctionArgs } from 'react-router';
import { withRecentSignIn } from '@api/recentSignIn';
import type { AuthSessionApiModel, PasskeyApiModel } from '@app-types/models';
import type { JSONResponseUtil } from '@app-types/utility';
import { AUTH_ROUTES_PATHS } from '@application/routes/routesUtils';
import { forgetSignedInUser } from '@application/routes/signedInUserMiddleware';
import authService from '@services/authService/authService';
import { CreatePasskeySchema, SetPasswordSchema } from '@services/authService/authService.type';
import { parseFormData } from '@utils/formDataUtils';
import { createPasskey } from '@utils/passkeyUtils';
import {
  addPasskeyFormSchema,
  type AddPasskeyFormData,
  type DeletePasskeyFormData,
  type SetPasswordFormData,
} from './settingsUtils';
import { failWhenInvalid } from '@utils/actionUtils';

// Settings → Security. The passkey actions run their browser ceremony here too, started by the dialog's submit.
// Changing a passkey or the password needs a recent sign-in: the first try may answer REAUTH_REQUIRED, and the
// dialog then submits again with `reauth` (see withRecentSignIn).

async function registerPasskey(name: string): Promise<JSONResponseUtil<PasskeyApiModel>> {
  const options = await authService.startAddPasskey();

  if (!options.success || !options.data) return { success: false, error: options.error };

  const ceremony = await createPasskey(options.data);

  if ('failure' in ceremony) return { success: false, error: { code: ceremony.failure } };

  const fields = await CreatePasskeySchema.validate({ response: ceremony.response, name });

  return authService.addPasskey(fields);
}

export const addPasskeyAction = async ({ request }: ActionFunctionArgs): Promise<JSONResponseUtil<PasskeyApiModel>> => {
  const { passkey, reauth } = parseFormData<AddPasskeyFormData>(await request.formData());

  return failWhenInvalid(async () => {
    const { name } = await addPasskeyFormSchema.validate(passkey);

    return withRecentSignIn(reauth, () => registerPasskey(name));
  });
};

export const deletePasskeyAction = async ({ request, params }: ActionFunctionArgs): Promise<JSONResponseUtil> => {
  const { reauth } = parseFormData<DeletePasskeyFormData>(await request.formData());

  return withRecentSignIn(reauth, () => authService.deletePasskey(String(params.passkeyId)));
};

export const setPasswordAction = async ({
  request,
}: ActionFunctionArgs): Promise<JSONResponseUtil<AuthSessionApiModel>> => {
  const { credentials, reauth } = parseFormData<SetPasswordFormData>(await request.formData());

  return failWhenInvalid(async () => {
    const fields = await SetPasswordSchema.validate(credentials);

    const result = await withRecentSignIn(reauth, () => authService.setPassword(fields));

    // The user now has a username: the shell asks for it again when it revalidates.
    if (result.success) forgetSignedInUser();

    return result;
  });
};

// Public on the API (204 even for an expired session): only a request that never got an answer fails here.
export const signOutAction = async (): Promise<JSONResponseUtil | Response> => {
  const result = await authService.logout();

  if (!result.success) return result;

  forgetSignedInUser();

  return redirect(AUTH_ROUTES_PATHS.LOGIN);
};

export const signOutEverywhereAction = async (): Promise<JSONResponseUtil | Response> => {
  const result = await authService.logoutEverywhere();

  if (!result.success) return result;

  forgetSignedInUser();

  return redirect(AUTH_ROUTES_PATHS.LOGIN);
};
