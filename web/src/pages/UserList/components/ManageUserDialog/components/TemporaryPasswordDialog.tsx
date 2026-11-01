import { yupResolver } from '@hookform/resolvers/yup';
import { KeyRound } from 'lucide-react';
import type { UserApiModel, UserWithTemporaryPasswordApiModel } from '@app-types/models';
import { HttpVerbsUtil, ReauthMethodUtil } from '@app-types/utility';
import TextField from '@components/TextField';
import { AlertDialogFooter } from '@components/ui/alert-dialog';
import { Button } from '@components/ui/button';
import { useFormCompat } from '@hooks/useFormCompat';
import { CONFLICT_STATUS } from '@utils/httpStatusUtils';
import { userTitle } from '../../../userListUtils';
import TemporaryPasswordView from '../../TemporaryPasswordView';
import { useUserChange } from '../hooks/useUserChange';
import {
  SIGNS_OUT_EVERYWHERE,
  USERNAME_FORM_DEFAULT_VALUES,
  usernameFormSchema,
  type UsernameFormValues,
} from '../manageUserDialogUtils';
import UserChangeDialog, { type UserChangeConfirm } from './UserChangeDialog';
import UserChangeFooter from './UserChangeFooter';

type Props = {
  user: UserApiModel;
  onClose: () => void;
};

const FORM_ID = 'new-temporary-password';
const CONFIRM_PASSWORD_FORM_ID = `${FORM_ID}-confirm`;
const CONFIRM_LABEL = 'Make password';
const NEW_PASSWORD_DESCRIPTION = 'Their old password stops working. Passkeys they added keep working.';
const NEEDS_USERNAME_DESCRIPTION = 'They have no username yet: pick the one they sign in with.';

// For a user who forgot their password: the API makes a new temporary password, shown once here to copy, by the same
// rules as for a new user (7 days, replaced at the first sign-in). A user with no username gets one now.
function TemporaryPasswordDialog({ user, onClose }: Props) {
  const change = useUserChange<UserWithTemporaryPasswordApiModel>(user.id);
  const { control, handleSubmit } = useFormCompat<UsernameFormValues>({
    defaultValues: USERNAME_FORM_DEFAULT_VALUES,
    resolver: yupResolver(usernameFormSchema),
  });
  const name = userTitle(user);
  const needsUsername = user.username === null;
  const isUsernameTaken = change.failure?.statusCode === CONFLICT_STATUS;
  const description = `${needsUsername ? NEEDS_USERNAME_DESCRIPTION : NEW_PASSWORD_DESCRIPTION} ${SIGNS_OUT_EVERYWHERE}`;

  function submitWithUsername(reauthMethod: ReauthMethodUtil) {
    return handleSubmit((values) => change.submit(HttpVerbsUtil.POST, values, reauthMethod));
  }

  const makePassword = (reauthMethod: ReauthMethodUtil) => {
    if (needsUsername) {
      void submitWithUsername(reauthMethod)();
      return;
    }

    change.submit(HttpVerbsUtil.POST, {}, reauthMethod);
  };

  const confirm: UserChangeConfirm = {
    step: change.step,
    passwordFormId: CONFIRM_PASSWORD_FORM_ID,
    onConfirm: makePassword,
  };

  if (change.result) {
    return (
      <UserChangeDialog
        title="New temporary password"
        description={`Give it to ${name}.`}
        isSaving={false}
        failure={undefined}
        onClose={onClose}
        footer={
          <AlertDialogFooter>
            <Button onClick={onClose}>Done</Button>
          </AlertDialogFooter>
        }
      >
        <TemporaryPasswordView result={change.result} idPrefix={FORM_ID} />
      </UserChangeDialog>
    );
  }

  return (
    <UserChangeDialog
      title={`Give ${name} a new temporary password?`}
      description={description}
      nextStep={`Then ${name} gets a new temporary password.`}
      confirm={confirm}
      isSaving={change.isSaving}
      failure={isUsernameTaken ? undefined : change.failure}
      onClose={onClose}
      footer={
        <UserChangeFooter
          confirmLabel={CONFIRM_LABEL}
          confirmIcon={<KeyRound data-icon="inline-start" aria-hidden="true" />}
          isDestructive={false}
          isSaving={change.isSaving}
          confirm={confirm}
          formId={needsUsername ? FORM_ID : undefined}
        />
      }
    >
      {needsUsername ? (
        <form id={FORM_ID} onSubmit={(event) => void submitWithUsername(ReauthMethodUtil.PASSKEY)(event)} noValidate>
          <TextField
            control={control}
            idPrefix={FORM_ID}
            name="username"
            label="Username"
            autoComplete="off"
            description="What they sign in with: letters, digits, dots, dashes or underscores."
            serverError={isUsernameTaken ? change.failure?.message : undefined}
            isPlainText
          />
        </form>
      ) : null}
    </UserChangeDialog>
  );
}

export default TemporaryPasswordDialog;
