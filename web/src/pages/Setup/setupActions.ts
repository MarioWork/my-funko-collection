import { redirect, type ActionFunctionArgs } from 'react-router';
import type { AuthSessionApiModel } from '@app-types/models';
import type { JSONResponseUtil } from '@app-types/utility';
import { defaultRedirectRoute } from '@application/routes/routesUtils';
import authService from '@services/authService/authService';
import { FinishSetupSchema, StartSetupSchema } from '@services/authService/authService.type';
import { parseFormData } from '@utils/formDataUtils';
import { createPasskey } from '@utils/passkeyUtils';
import type { SetupFormData } from './setupUtils';
import { failWhenInvalid } from '@utils/actionUtils';

// The first run, started by the form's submit: check the code and name and get options from the API, let the
// browser create the passkey, then send it back. The API signs the new user in, so the app opens straight away.
export const setUpAction = async ({
  request,
}: ActionFunctionArgs): Promise<JSONResponseUtil<AuthSessionApiModel> | Response> => {
  const { setup } = parseFormData<SetupFormData>(await request.formData());

  return failWhenInvalid(async () => {
    const fields = await StartSetupSchema.validate({ code: setup.code, name: setup.name });
    const options = await authService.startSetup(fields);

    if (!options.success || !options.data) return { success: false, error: options.error };

    const ceremony = await createPasskey(options.data);

    if ('failure' in ceremony) return { success: false, error: { code: ceremony.failure } };

    // Left empty, the API names the passkey after the device.
    const passkeyName = setup.passkeyName?.trim() || undefined;
    const setupFields = await FinishSetupSchema.validate({ ...fields, response: ceremony.response, passkeyName });
    const result = await authService.finishSetup(setupFields);

    if (!result.success) return result;

    return redirect(defaultRedirectRoute);
  });
};
