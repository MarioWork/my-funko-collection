import { redirect, type ActionFunctionArgs } from 'react-router';
import { ValidationError } from 'yup';
import { withFreshSignIn } from '@api/passkeyFlows';
import type { PasskeyApiModel } from '@app-types/models';
import type { JSONResponseUtil } from '@app-types/utility';
import { AUTH_ROUTES_PATHS } from '@application/routes/routesUtils';
import authService from '@services/authService/authService';
import { CreatePasskeySchema } from '@services/authService/authService.type';
import { parseFormData } from '@utils/formDataUtils';
import { createPasskey } from '@utils/passkeyUtils';
import { addPasskeyFormSchema, type AddPasskeyFormData, type DeletePasskeyFormData } from './settingsUtils';

// Settings → Security. The passkey actions run their browser ceremony here too, started by the dialog's submit.

async function registerPasskey(name: string): Promise<JSONResponseUtil<PasskeyApiModel>> {
  const options = await authService.startAddPasskey();

  if (!options.success || !options.data) return { success: false, error: options.error };

  const ceremony = await createPasskey(options.data);

  if ('failure' in ceremony) return { success: false, error: { code: ceremony.failure } };

  const fields = await CreatePasskeySchema.validate({ response: ceremony.response, name });

  return authService.addPasskey(fields);
}

// Both passkey writes need a recent sign-in: the first try may answer REAUTH_REQUIRED, and the dialog then submits
// again with `isReauth` (see withFreshSignIn).
export const addPasskeyAction = async ({ request }: ActionFunctionArgs): Promise<JSONResponseUtil<PasskeyApiModel>> => {
  const { passkey, isReauth } = parseFormData<AddPasskeyFormData>(await request.formData());

  try {
    const { name } = await addPasskeyFormSchema.validate(passkey);

    return await withFreshSignIn(isReauth === true, () => registerPasskey(name));
  } catch (error) {
    if (error instanceof ValidationError) return { success: false };

    throw error;
  }
};

export const deletePasskeyAction = async ({ request, params }: ActionFunctionArgs): Promise<JSONResponseUtil> => {
  const { isReauth } = parseFormData<DeletePasskeyFormData>(await request.formData());

  return withFreshSignIn(isReauth === true, () => authService.deletePasskey(String(params.passkeyId)));
};

// Public on the API (204 even for an expired session): only a request that never got an answer fails here.
export const signOutAction = async (): Promise<JSONResponseUtil | Response> => {
  const result = await authService.logout();

  if (!result.success) return result;

  return redirect(AUTH_ROUTES_PATHS.LOGIN);
};

export const signOutEverywhereAction = async (): Promise<JSONResponseUtil | Response> => {
  const result = await authService.logoutEverywhere();

  if (!result.success) return result;

  return redirect(AUTH_ROUTES_PATHS.LOGIN);
};
