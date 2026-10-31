import { yupResolver } from '@hookform/resolvers/yup';
import { useFetcher, useNavigate } from 'react-router';
import type { CreatedUserApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import { USER_ROUTES_PATHS } from '@application/routes/routesUtils';
import FormPanel from '@components/FormPanel';
import InlineAlert from '@components/InlineAlert';
import ReauthNotice from '@components/ReauthNotice';
import { useConfirmIdentityStep } from '@hooks/useConfirmIdentityStep';
import { useFormCompat } from '@hooks/useFormCompat';
import { AuthApiErrorCodes } from '@services/authService/authService';
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
import TemporaryPasswordView from './components/TemporaryPasswordView';

const FORM_ID = 'add-user';

// Routed under /users/add. The admin gives a username and a role; the API makes a temporary password, which the
// dialog shows once to copy. Closing goes back to the list, where the new user already shows.
function AddUserDialog() {
  const fetcher = useFetcher<JSONResponseUtil<CreatedUserApiModel>>();
  const navigate = useNavigate();
  const { control, handleSubmit } = useFormCompat<AddUserFormValues>({
    defaultValues: ADD_USER_DEFAULT_VALUES,
    resolver: yupResolver(addUserFormSchema),
  });
  const isSaving = fetcher.state !== 'idle';
  const created = fetcher.data?.success && !isSaving ? fetcher.data.data : undefined;
  const failure = fetcher.data?.success === false && !isSaving ? fetcher.data.error : undefined;
  const needsReauth = useConfirmIdentityStep(failure);
  const isUsernameTaken = failure?.statusCode === CONFLICT_STATUS;
  // The reauth answer shows as the notice, a taken username on its field; anything else in the alert.
  const isAlerted = failure !== undefined && failure.code !== AuthApiErrorCodes.REAUTH_REQUIRED && !isUsernameTaken;

  const close = () => void navigate(USER_ROUTES_PATHS.BASE);

  const onSubmit = handleSubmit((user) => {
    void fetcher.submit(createFormData({ user, isReauth: needsReauth }), { method: HttpVerbsUtil.POST });
  });

  return (
    <FormPanel
      title={created ? 'User created' : 'New user'}
      description={created ? undefined : 'They get a temporary password to sign in with, and choose their own then.'}
      onClose={close}
      footer={
        <AddUserFooter
          formId={FORM_ID}
          isSaving={isSaving}
          needsReauth={needsReauth}
          isCreated={created !== undefined}
          onClose={close}
        />
      }
    >
      {created ? (
        <TemporaryPasswordView created={created} idPrefix={FORM_ID} />
      ) : (
        <form id={FORM_ID} onSubmit={(event) => void onSubmit(event)} noValidate className="flex flex-col gap-4">
          <AddUserFields
            control={control}
            idPrefix={FORM_ID}
            usernameError={isUsernameTaken ? failure.message : undefined}
          />
          {needsReauth ? <ReauthNotice nextStep="Then the user is created." /> : null}
          {isAlerted ? (
            <InlineAlert tone="error">{authFailureMessage(failure, ADD_USER_FAILURE_MESSAGES)}</InlineAlert>
          ) : null}
        </form>
      )}
    </FormPanel>
  );
}

export default AddUserDialog;
