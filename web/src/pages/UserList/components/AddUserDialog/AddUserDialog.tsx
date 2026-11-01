import { yupResolver } from '@hookform/resolvers/yup';
import { useFetcher, useNavigate } from 'react-router';
import type { UserWithTemporaryPasswordApiModel } from '@app-types/models';
import { HttpVerbsUtil, ReauthMethodUtil, type JSONResponseUtil } from '@app-types/utility';
import { USER_ROUTES_PATHS } from '@application/routes/routesUtils';
import ConfirmPasswordField from '@components/ConfirmPasswordField';
import FormPanel from '@components/FormPanel';
import InlineAlert from '@components/InlineAlert';
import ReauthNotice from '@components/ReauthNotice';
import { useConfirmIdentityStep } from '@hooks/useConfirmIdentityStep';
import { useFormCompat } from '@hooks/useFormCompat';
import { authFailureMessage } from '@utils/authMessageUtils';
import { CONFLICT_STATUS } from '@utils/httpStatusUtils';
import { createFormData } from '@utils/formDataUtils';
import {
  ADD_USER_DEFAULT_VALUES,
  ADD_USER_FAILURE_MESSAGES,
  addUserFormSchema,
  type AddUserFormValues,
} from './addUserDialogUtils';
import AddUserFields from './components/AddUserFields';
import AddUserFooter from './components/AddUserFooter';
import TemporaryPasswordView from '../TemporaryPasswordView';

const FORM_ID = 'add-user';
const CONFIRM_PASSWORD_FORM_ID = `${FORM_ID}-confirm`;

// Routed under /users/add. The admin gives a username and a role; the API makes a temporary password, which the
// dialog shows once to copy. Closing goes back to the list, where the new user already shows.
function AddUserDialog() {
  const fetcher = useFetcher<JSONResponseUtil<UserWithTemporaryPasswordApiModel>>();
  const navigate = useNavigate();
  const { control, handleSubmit } = useFormCompat<AddUserFormValues>({
    defaultValues: ADD_USER_DEFAULT_VALUES,
    resolver: yupResolver(addUserFormSchema),
  });
  const isSaving = fetcher.state !== 'idle';
  const created = fetcher.data?.success && !isSaving ? fetcher.data.data : undefined;
  const failure = fetcher.data?.success === false && !isSaving ? fetcher.data.error : undefined;
  const step = useConfirmIdentityStep(failure);
  const isUsernameTaken = failure?.statusCode === CONFLICT_STATUS;
  // The confirm step's answers show in the step, a taken username on its field; anything else in the alert.
  const isAlerted = failure !== undefined && !step.isStepFailure && !isUsernameTaken;

  const close = () => void navigate(USER_ROUTES_PATHS.BASE);

  const submitWith = (method: ReauthMethodUtil) =>
    handleSubmit((user) => {
      void fetcher.submit(createFormData({ user, reauth: step.reauthFor(method) }), { method: HttpVerbsUtil.POST });
    });

  const confirm = (method: ReauthMethodUtil) => void submitWith(method)();

  return (
    <FormPanel
      title={created ? 'User created' : 'New user'}
      description={created ? undefined : 'They get a temporary password to sign in with, and choose their own then.'}
      onClose={close}
      footer={
        <AddUserFooter
          formId={FORM_ID}
          passwordFormId={CONFIRM_PASSWORD_FORM_ID}
          isSaving={isSaving}
          step={step}
          isCreated={created !== undefined}
          onConfirm={confirm}
          onClose={close}
        />
      }
    >
      {created ? (
        <TemporaryPasswordView result={created} idPrefix={FORM_ID} />
      ) : (
        <div className="flex flex-col gap-4">
          <form
            id={FORM_ID}
            onSubmit={(event) => void submitWith(ReauthMethodUtil.PASSKEY)(event)}
            noValidate
            className="flex flex-col gap-4"
          >
            <AddUserFields
              control={control}
              idPrefix={FORM_ID}
              usernameError={isUsernameTaken ? failure.message : undefined}
            />
            {step.needsReauth ? (
              <ReauthNotice nextStep="Then the user is created." canUsePassword={step.canUsePassword} />
            ) : null}
          </form>
          <ConfirmPasswordField step={step} formId={CONFIRM_PASSWORD_FORM_ID} onConfirm={confirm} />
          {isAlerted ? (
            <InlineAlert tone="error">{authFailureMessage(failure, ADD_USER_FAILURE_MESSAGES)}</InlineAlert>
          ) : null}
        </div>
      )}
    </FormPanel>
  );
}

export default AddUserDialog;
