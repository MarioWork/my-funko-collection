import { yupResolver } from '@hookform/resolvers/yup';
import { KeyRound } from 'lucide-react';
import { useFetcher } from 'react-router';
import type { AuthSessionApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import DisabledReason from '@components/DisabledReason';
import InlineAlert from '@components/InlineAlert';
import TextField from '@components/TextField';
import { Button } from '@components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@components/ui/field';
import { Input } from '@components/ui/input';
import { Spinner } from '@components/ui/spinner';
import { useFormCompat } from '@hooks/useFormCompat';
import { PASSWORD_MIN_LENGTH } from '@utils/authUtils';
import { authFailureMessage } from '@utils/authMessageUtils';
import { DISABLED_REASONS, reasonWhen } from '@utils/disabledReasonUtils';
import { createFormData } from '@utils/formDataUtils';
import {
  PASSWORD_FIELD_CODES,
  SET_PASSWORD_FAILURE_MESSAGES,
  SetPasswordIntents,
  setOwnPasswordFormSchema,
  type SetOwnPasswordFormValues,
} from '../setPasswordUtils';

type Props = {
  // The username the admin gave: shown, not typed, and sent with the new password.
  username: string | null;
};

const FORM_ID = 'set-own-password';
const PASSWORD_HINT = `At least ${PASSWORD_MIN_LENGTH} characters. A few words in a row is easy to remember and hard to guess.`;

// "username" and "new-password" fields, so a password manager offers to make one and saves it with the username.
// The API's refusals of the password itself (too common, the temporary one again) show on its field.
function SetOwnPasswordForm({ username }: Props) {
  const fetcher = useFetcher<JSONResponseUtil<AuthSessionApiModel>>();
  const { control, handleSubmit } = useFormCompat<SetOwnPasswordFormValues>({
    defaultValues: { password: '' },
    resolver: yupResolver(setOwnPasswordFormSchema),
  });
  const isSaving = fetcher.state !== 'idle';
  const hasFailed = fetcher.data?.success === false && !isSaving;
  const failure = hasFailed ? fetcher.data?.error : undefined;
  const isPasswordFailure = failure?.code !== undefined && PASSWORD_FIELD_CODES.has(failure.code);
  const passwordError = isPasswordFailure ? failure.message : undefined;
  const hasAlert = hasFailed && !isPasswordFailure;

  const onSubmit = handleSubmit(({ password }) => {
    void fetcher.submit(createFormData({ intent: SetPasswordIntents.SAVE, credentials: { username, password } }), {
      method: HttpVerbsUtil.POST,
    });
  });

  return (
    <form
      id={FORM_ID}
      aria-label="Choose your password"
      onSubmit={(event) => void onSubmit(event)}
      noValidate
      className="flex flex-col gap-4"
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor={`${FORM_ID}-username`}>Username</FieldLabel>
          <Input id={`${FORM_ID}-username`} value={username ?? ''} autoComplete="username" readOnly />
        </Field>
        <TextField
          control={control}
          idPrefix={FORM_ID}
          name="password"
          label="New password"
          type="password"
          autoComplete="new-password"
          description={PASSWORD_HINT}
          serverError={passwordError}
          isPlainText
        />
      </FieldGroup>
      <DisabledReason reason={reasonWhen(isSaving, DISABLED_REASONS.SAVING)}>
        <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={isSaving}>
          {isSaving ? <Spinner data-icon="inline-start" /> : <KeyRound data-icon="inline-start" aria-hidden="true" />}
          Save and open my collection
        </Button>
      </DisabledReason>
      {hasAlert ? (
        <InlineAlert tone="error">{authFailureMessage(failure, SET_PASSWORD_FAILURE_MESSAGES)}</InlineAlert>
      ) : null}
    </form>
  );
}

export default SetOwnPasswordForm;
