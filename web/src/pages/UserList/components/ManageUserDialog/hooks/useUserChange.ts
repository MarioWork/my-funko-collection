import { useFetcher, type FetcherWithComponents } from 'react-router';
import type { ApiError, UserId } from '@app-types/models';
import type { HttpVerbsUtil, JSONResponseUtil } from '@app-types/utility';
import { USER_ROUTES_PATHS } from '@application/routes/routesUtils';
import { useConfirmIdentityStep } from '@hooks/useConfirmIdentityStep';
import { AuthApiErrorCodes } from '@services/authService/authService';
import { createFormData } from '@utils/formDataUtils';
import type { ManageUserFormData } from '../manageUserDialogUtils';

type UserChangeState<Data> = {
  // For the shared toast and close-on-success hooks.
  fetcher: FetcherWithComponents<JSONResponseUtil<Data>>;
  isSaving: boolean;
  // After a REAUTH_REQUIRED answer the next press confirms with a passkey first.
  needsReauth: boolean;
  // The failure to show; the reauth answer shows as the confirm step instead.
  failure: ApiError | undefined;
  // The settled success's answer.
  result: Data | undefined;
  submit: (method: HttpVerbsUtil, user?: ManageUserFormData['user']) => void;
};

// One change to one user (its own fetcher, so each confirm dialog starts clean), sent to the manage route's action.
export function useUserChange<Data = unknown>(userId: UserId): UserChangeState<Data> {
  const fetcher = useFetcher<JSONResponseUtil<Data>>();
  const isSaving = fetcher.state !== 'idle';
  const settled = isSaving ? undefined : fetcher.data;
  const anyFailure = settled?.success === false ? settled.error : undefined;
  const needsReauth = useConfirmIdentityStep(anyFailure);
  const isReauthAnswer = anyFailure?.code === AuthApiErrorCodes.REAUTH_REQUIRED;
  const isDone = settled?.success === true;

  const submit = (method: HttpVerbsUtil, user?: ManageUserFormData['user']) => {
    void fetcher.submit(createFormData({ user, isReauth: needsReauth }), {
      method,
      action: USER_ROUTES_PATHS.manage(String(userId)),
    });
  };

  return {
    fetcher,
    isSaving,
    needsReauth,
    failure: isReauthAnswer ? undefined : anyFailure,
    result: isDone ? settled.data : undefined,
    submit,
  };
}
