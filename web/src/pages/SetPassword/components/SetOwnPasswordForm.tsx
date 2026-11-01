import { yupResolver } from '@hookform/resolvers/yup';
import { useFetcher } from 'react-router';
import type { AuthSessionApiModel } from '@app-types/models';
import { HttpVerbsUtil, ReauthMethodUtil, type JSONResponseUtil } from '@app-types/utility';
import ConfirmPasswordField from '@components/ConfirmPasswordField';
import InlineAlert from '@components/InlineAlert';
import { useConfirmIdentityStep } from '@hooks/useConfirmIdentityStep';
import { useFormCompat } from '@hooks/useFormCompat';
import { authFailureMessage } from '@utils/authMessageUtils';
import { createFormData } from '@utils/formDataUtils';
import {
  CONFIRM_WITH_TEMPORARY_PASSWORD,
  PASSWORD_FIELD_CODES,
  SET_PASSWORD_FAILURE_MESSAGES,
  SetPasswordIntents,
  setOwnPasswordFormSchema,
  type SetOwnPasswordFormValues,
} from '../setPasswordUtils';
import SetOwnPasswordButtons from './SetOwnPasswordButtons';
import SetOwnPasswordFields from './SetOwnPasswordFields';

type Props = {
  // The username the admin gave: shown, not typed, and sent with the new password.
  username: string | null;
};

const FORM_ID = 'set-own-password';
const CONFIRM_PASSWORD_FORM_ID = `${FORM_ID}-confirm`;

// The new password under the username the admin gave. The API's refusals of the password itself show on its field.
// Past the 10 minutes of a recent sign-in, the temporary password confirms it's them right here (no sign-out).
function SetOwnPasswordForm({ username }: Props) {
  const fetcher = useFetcher<JSONResponseUtil<AuthSessionApiModel>>();
  const { control, handleSubmit } = useFormCompat<SetOwnPasswordFormValues>({
    defaultValues: { password: '' },
    resolver: yupResolver(setOwnPasswordFormSchema),
  });
  const isSaving = fetcher.state !== 'idle';
  const failure = fetcher.data?.success === false && !isSaving ? fetcher.data.error : undefined;
  const step = useConfirmIdentityStep(failure, { isPasswordOnly: true });
  const isPasswordFailure = failure?.code !== undefined && PASSWORD_FIELD_CODES.has(failure.code);
  const passwordError = isPasswordFailure ? failure.message : undefined;
  const hasAlert = failure !== undefined && !isPasswordFailure && !step.isStepFailure;

  function submitWith(method: ReauthMethodUtil) {
    return handleSubmit(({ password }) => {
      const formData = createFormData({
        intent: SetPasswordIntents.SAVE,
        credentials: { username, password },
        reauth: step.chooseReauth(method),
      });

      void fetcher.submit(formData, { method: HttpVerbsUtil.POST });
    });
  }

  const confirm = (method: ReauthMethodUtil) => void submitWith(method)();

  return (
    <div className="flex flex-col gap-4">
      <form
        id={FORM_ID}
        aria-label="Choose your password"
        onSubmit={(event) => void submitWith(ReauthMethodUtil.PASSWORD)(event)}
        noValidate
        className="flex flex-col gap-4"
      >
        <SetOwnPasswordFields control={control} idPrefix={FORM_ID} username={username} passwordError={passwordError} />
        {step.needsReauth ? <InlineAlert tone="info">{CONFIRM_WITH_TEMPORARY_PASSWORD}</InlineAlert> : null}
      </form>
      <ConfirmPasswordField step={step} formId={CONFIRM_PASSWORD_FORM_ID} onConfirm={confirm} />
      <SetOwnPasswordButtons
        formId={FORM_ID}
        passwordFormId={CONFIRM_PASSWORD_FORM_ID}
        isSaving={isSaving}
        step={step}
        onConfirm={confirm}
      />
      {hasAlert ? (
        <InlineAlert tone="error">{authFailureMessage(failure, SET_PASSWORD_FAILURE_MESSAGES)}</InlineAlert>
      ) : null}
    </div>
  );
}

export default SetOwnPasswordForm;
