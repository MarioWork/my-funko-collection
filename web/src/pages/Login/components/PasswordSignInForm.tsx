import { yupResolver } from '@hookform/resolvers/yup';
import { LogIn } from 'lucide-react';
import { useFetcher } from 'react-router';
import type { AuthSessionApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import DisabledReason from '@components/DisabledReason';
import InlineAlert from '@components/InlineAlert';
import TextField from '@components/TextField';
import { Button } from '@components/ui/button';
import { FieldGroup } from '@components/ui/field';
import { Spinner } from '@components/ui/spinner';
import { useFormCompat } from '@hooks/useFormCompat';
import { authFailureMessage } from '@utils/authMessageUtils';
import { DISABLED_REASONS, reasonWhen } from '@utils/disabledReasonUtils';
import { createFormData } from '@utils/formDataUtils';
import {
  LoginIntents,
  PASSWORD_LOGIN_FAILURE_MESSAGES,
  passwordSignInFormSchema,
  type PasswordSignInFormValues,
} from '../loginUtils';

const FORM_ID = 'password-sign-in';

// A plain form with "username" and "current-password" fields, so password managers fill it and paste works.
// The submit goes to the login action with the password intent.
function PasswordSignInForm() {
  const fetcher = useFetcher<JSONResponseUtil<AuthSessionApiModel>>();
  const { control, handleSubmit } = useFormCompat<PasswordSignInFormValues>({
    defaultValues: { username: '', password: '' },
    resolver: yupResolver(passwordSignInFormSchema),
  });
  const isSigningIn = fetcher.state !== 'idle';
  const hasFailed = fetcher.data?.success === false && !isSigningIn;
  const failure = hasFailed ? fetcher.data?.error : undefined;

  const onSubmit = handleSubmit((credentials) => {
    void fetcher.submit(createFormData({ intent: LoginIntents.PASSWORD, credentials }), {
      method: HttpVerbsUtil.POST,
    });
  });

  return (
    <form
      id={FORM_ID}
      aria-label="Sign in with a password"
      onSubmit={(event) => void onSubmit(event)}
      noValidate
      className="flex flex-col gap-4"
    >
      <FieldGroup>
        <TextField
          control={control}
          idPrefix={FORM_ID}
          name="username"
          label="Username"
          autoComplete="username"
          isPlainText
        />
        <TextField
          control={control}
          idPrefix={FORM_ID}
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          isPlainText
        />
      </FieldGroup>
      <DisabledReason reason={reasonWhen(isSigningIn, DISABLED_REASONS.SIGNING_IN)}>
        <Button type="submit" variant="secondary" size="lg" className="h-12 w-full text-base" disabled={isSigningIn}>
          {isSigningIn ? <Spinner data-icon="inline-start" /> : <LogIn data-icon="inline-start" aria-hidden="true" />}
          Sign in with password
        </Button>
      </DisabledReason>
      {hasFailed ? (
        <InlineAlert tone="error">{authFailureMessage(failure, PASSWORD_LOGIN_FAILURE_MESSAGES)}</InlineAlert>
      ) : null}
    </form>
  );
}

export default PasswordSignInForm;
