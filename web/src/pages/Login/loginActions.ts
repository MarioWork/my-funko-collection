import { redirect, type ActionFunctionArgs } from 'react-router';
import { signInWithPasskey } from '@api/passkeyFlows';
import type { AuthSessionApiModel } from '@app-types/models';
import type { JSONResponseUtil } from '@app-types/utility';
import { redirectTargetOf } from '@utils/authRedirectUtils';
import { failWhenInvalid } from '@utils/actionUtils';

// The whole sign-in runs here, started by the button's click: options from the API, the browser's passkey prompt,
// then the check. Signed in, it goes back to the page that sent the user here (?redirectTo=), or Home.
export const signInAction = async ({
  request,
}: ActionFunctionArgs): Promise<JSONResponseUtil<AuthSessionApiModel> | Response> => {
  return failWhenInvalid(async () => {
    const result = await signInWithPasskey();

    if (!result.success) return result;

    return redirect(redirectTargetOf(new URL(request.url)));
  });
};
