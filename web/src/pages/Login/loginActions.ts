import { redirect, type ActionFunctionArgs } from 'react-router';
import { signInWithPasskey } from '@api/passkeyFlows';
import type { AuthSessionApiModel } from '@app-types/models';
import type { JSONResponseUtil } from '@app-types/utility';
import authService from '@services/authService/authService';
import { PasswordSignInSchema } from '@services/authService/authService.type';
import { redirectTargetOf } from '@utils/authRedirectUtils';
import { failWhenInvalid } from '@utils/actionUtils';
import { parseFormData } from '@utils/formDataUtils';
import { LoginIntents, type LoginFormData } from './loginUtils';

type SignIn = (formData: LoginFormData) => Promise<JSONResponseUtil<AuthSessionApiModel>>;

async function signInWithPassword({ credentials }: LoginFormData): Promise<JSONResponseUtil<AuthSessionApiModel>> {
  const fields = await PasswordSignInSchema.validate(credentials);

  return authService.signInWithPassword(fields);
}

// The passkey sign-in runs here whole, started by the button's click: options from the API, the browser's passkey
// prompt, then the check.
const SIGN_IN_MAP: Record<LoginIntents, SignIn> = {
  [LoginIntents.PASSKEY]: () => signInWithPasskey(),
  [LoginIntents.PASSWORD]: signInWithPassword,
};

// Signed in either way, it goes back to the page that sent the user here (?redirectTo=), or Home.
export const signInAction = async ({
  request,
}: ActionFunctionArgs): Promise<JSONResponseUtil<AuthSessionApiModel> | Response> => {
  const formData = parseFormData<LoginFormData>(await request.formData());
  const signIn = SIGN_IN_MAP[formData.intent] ?? SIGN_IN_MAP[LoginIntents.PASSKEY];

  return failWhenInvalid(async () => {
    const result = await signIn(formData);

    if (!result.success) return result;

    return redirect(redirectTargetOf(new URL(request.url)));
  });
};
