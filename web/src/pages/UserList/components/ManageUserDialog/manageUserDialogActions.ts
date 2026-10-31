import type { ActionFunctionArgs } from 'react-router';
import { withFreshSignIn } from '@api/passkeyFlows';
import type { UserId } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import userService from '@services/userService/userService';
import { CreateTemporaryPasswordSchema, UpdateUserSchema } from '@services/userService/userService.type';
import { actionForVerbs, failWhenInvalid, type VerbActionMap } from '@utils/actionUtils';
import { assertAdmin } from '@utils/adminRouteUtils';
import { parseFormData } from '@utils/formDataUtils';
import type { ManageUserFormData } from './manageUserDialogUtils';

type ManageUserRequest = ManageUserFormData & { userId: UserId };

// Every change to a user needs the admin's sign-in from the last 10 minutes: the first try may answer
// REAUTH_REQUIRED, and the dialog then submits again with `isReauth` (see withFreshSignIn).
async function readRequest({ request, params, context }: ActionFunctionArgs): Promise<ManageUserRequest> {
  assertAdmin(context);

  const formData = parseFormData<ManageUserFormData>(await request.formData());

  return { ...formData, userId: Number(params.userId) };
}

export const changeUserRoleAction = async (args: ActionFunctionArgs): Promise<JSONResponseUtil> => {
  const { user, isReauth, userId } = await readRequest(args);

  return failWhenInvalid(async () => {
    const fields = await UpdateUserSchema.validate(user);

    return withFreshSignIn(isReauth === true, () => userService.updateUser(userId, fields));
  });
};

// The answer carries the new temporary password, the only time it is sent.
export const addTemporaryPasswordAction = async (args: ActionFunctionArgs): Promise<JSONResponseUtil> => {
  const { user, isReauth, userId } = await readRequest(args);

  return failWhenInvalid(async () => {
    const fields = await CreateTemporaryPasswordSchema.validate(user ?? {});

    return withFreshSignIn(isReauth === true, () => userService.addTemporaryPassword(userId, fields));
  });
};

export const deleteUserAction = async (args: ActionFunctionArgs): Promise<JSONResponseUtil> => {
  const { isReauth, userId } = await readRequest(args);

  return withFreshSignIn(isReauth === true, () => userService.deleteUser(userId));
};

const MANAGE_USER_ACTION_MAP: VerbActionMap = {
  [HttpVerbsUtil.PATCH]: changeUserRoleAction,
  [HttpVerbsUtil.POST]: addTemporaryPasswordAction,
  [HttpVerbsUtil.DELETE]: deleteUserAction,
};

export const manageUserAction = actionForVerbs(MANAGE_USER_ACTION_MAP);
