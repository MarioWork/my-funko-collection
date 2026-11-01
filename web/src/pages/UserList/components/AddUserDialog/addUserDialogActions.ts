import type { ActionFunctionArgs } from 'react-router';
import { withFreshSignIn } from '@api/freshSignIn';
import type { UserWithTemporaryPasswordApiModel } from '@app-types/models';
import type { JSONResponseUtil } from '@app-types/utility';
import userService from '@services/userService/userService';
import { CreateUserSchema } from '@services/userService/userService.type';
import { failWhenInvalid } from '@utils/actionUtils';
import { assertAdmin } from '@utils/adminRouteUtils';
import { parseFormData } from '@utils/formDataUtils';
import type { AddUserFormData } from './addUserDialogUtils';

// Creating a user needs the admin's sign-in from the last 10 minutes: the first try may answer REAUTH_REQUIRED, and
// the dialog then submits again with `reauth` (see withFreshSignIn). The answer carries the temporary password.
export const addUserAction = async ({
  request,
  context,
}: ActionFunctionArgs): Promise<JSONResponseUtil<UserWithTemporaryPasswordApiModel>> => {
  assertAdmin(context);

  const { user, reauth } = parseFormData<AddUserFormData>(await request.formData());

  return failWhenInvalid(async () => {
    const fields = await CreateUserSchema.validate(user);

    return withFreshSignIn(reauth, () => userService.addUser(fields));
  });
};
