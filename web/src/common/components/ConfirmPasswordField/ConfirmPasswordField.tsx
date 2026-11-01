import type { FormEvent } from 'react';
import { ReauthMethodUtil } from '@app-types/utility';
import { Field, FieldError, FieldLabel } from '@components/ui/field';
import { Input } from '@components/ui/input';
import type { ConfirmIdentityStep } from '@hooks/useConfirmIdentityStep';
import { CONFIRM_IDENTITY_COPY } from '@utils/reauthUtils';

type Props = {
  step: ConfirmIdentityStep;
  // Its own small form, so Enter confirms with the password; ConfirmIdentityButtons submits it by this id.
  formId: string;
  onConfirm: (method: ReauthMethodUtil) => void;
};

// The password half of "confirm it's you", shown once the server asked for a fresh sign-in and only to a user who
// has a password. A wrong one is shown on the field.
function ConfirmPasswordField({ step, formId, onConfirm }: Props) {
  if (!step.needsReauth || !step.canUsePassword) return null;

  const inputId = `${formId}-password`;
  const errorId = `${inputId}-error`;
  const isInvalid = step.passwordError !== undefined;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Its button stays off until something is typed (it says why); Enter in an empty field does nothing either.
    if (step.password !== '') onConfirm(ReauthMethodUtil.PASSWORD);
  };

  return (
    <form id={formId} onSubmit={submit} noValidate>
      <Field data-invalid={isInvalid || undefined}>
        <FieldLabel htmlFor={inputId}>{CONFIRM_IDENTITY_COPY.PASSWORD_LABEL}</FieldLabel>
        <Input
          id={inputId}
          type="password"
          autoComplete="current-password"
          value={step.password}
          onChange={(event) => step.setPassword(event.target.value)}
          aria-invalid={isInvalid || undefined}
          aria-describedby={isInvalid ? errorId : undefined}
        />
        <FieldError id={errorId} errors={isInvalid ? [{ message: step.passwordError }] : undefined} />
      </Field>
    </form>
  );
}

export default ConfirmPasswordField;
