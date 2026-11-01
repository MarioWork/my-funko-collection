import { useFetcher, type FetcherWithComponents } from 'react-router';
import type { ApiError, UserId } from '@app-types/models';
import { ReauthMethodUtil, type HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import { USER_ROUTES_PATHS } from '@application/routes/routesUtils';
import { useConfirmIdentityStep, type ConfirmIdentityStep } from '@hooks/useConfirmIdentityStep';
import { createFormData } from '@utils/formDataUtils';
import type { ManageUserFormData } from '../manageUserDialogUtils';

type UserChangeState<Data> = {
  // For the shared toast and close-on-success hooks.
  fetcher: FetcherWithComponents<JSONResponseUtil<Data>>;
  isSaving: boolean;
  // After a REAUTH_REQUIRED answer the next press confirms it's the admin first (a passkey or their password).
  step: ConfirmIdentityStep;
  // The failure to show; the confirm step shows its own answers instead.
  failure: ApiError | undefined;
  // The settled success's answer.
  result: Data | undefined;
  // `reauthMethod`: how the admin confirms, once asked; a passkey unless they pick their password.
  submit: (method: HttpVerbsUtil, user?: ManageUserFormData['user'], reauthMethod?: ReauthMethodUtil) => void;
};

// One change to one user (its own fetcher, so each confirm dialog starts clean), sent to the manage route's action.
export function useUserChange<Data = unknown>(userId: UserId): UserChangeState<Data> {
  const fetcher = useFetcher<JSONResponseUtil<Data>>();
  const isSaving = fetcher.state !== 'idle';
  const settled = isSaving ? undefined : fetcher.data;
  const anyFailure = settled?.success === false ? settled.error : undefined;
  const step = useConfirmIdentityStep(anyFailure);
  const isDone = settled?.success === true;

  const submit = (
    method: HttpVerbsUtil,
    user?: ManageUserFormData['user'],
    reauthMethod: ReauthMethodUtil = ReauthMethodUtil.PASSKEY,
  ) => {
    void fetcher.submit(createFormData({ user, reauth: step.reauthFor(reauthMethod) }), {
      method,
      action: USER_ROUTES_PATHS.manage(String(userId)),
    });
  };

  return {
    fetcher,
    isSaving,
    step,
    failure: step.isStepFailure ? undefined : anyFailure,
    result: isDone ? settled.data : undefined,
    submit,
  };
}
