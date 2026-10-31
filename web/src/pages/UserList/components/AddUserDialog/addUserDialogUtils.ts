import type { InferType } from 'yup';
import { UserRoleUtil, type AuthFailureMessagesUtil } from '@app-types/utility';
import { AuthApiErrorCodes } from '@services/authService/authService';
import { CreateUserSchema } from '@services/userService/userService.type';

// The form sends exactly what the API takes.
export const addUserFormSchema = CreateUserSchema;

export type AddUserFormValues = InferType<typeof addUserFormSchema>;

// `isReauth`: the admin has just been asked to confirm it's them (403 REAUTH_REQUIRED), see withFreshSignIn.
export type AddUserFormData = { user: AddUserFormValues; isReauth?: boolean };

// A new user is a member unless the admin says otherwise.
export const ADD_USER_DEFAULT_VALUES: AddUserFormValues = { username: '', role: UserRoleUtil.MEMBER };

export const ADD_USER_FAILURE_MESSAGES: AuthFailureMessagesUtil = {
  [AuthApiErrorCodes.SIGN_IN_FAILED]: "That passkey didn't work. Try again, or pick another one.",
};
