import type { Control } from 'react-hook-form';
import TextField from '@components/TextField';
import { Field, FieldGroup, FieldLabel } from '@components/ui/field';
import { Input } from '@components/ui/input';
import { NEW_PASSWORD_HINT } from '@utils/authUtils';
import type { SetOwnPasswordFormValues } from '../setPasswordUtils';

type Props = {
  control: Control<SetOwnPasswordFormValues>;
  idPrefix: string;
  // Shown, not typed: the username the admin gave.
  username: string | null;
  // The API's refusal of the password itself (too common, the temporary one again).
  passwordError: string | undefined;
};

// "username" and "new-password" fields, so a password manager offers to make one and saves it with the username.
function SetOwnPasswordFields({ control, idPrefix, username, passwordError }: Props) {
  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor={`${idPrefix}-username`}>Username</FieldLabel>
        <Input id={`${idPrefix}-username`} value={username ?? ''} autoComplete="username" readOnly />
      </Field>
      <TextField
        control={control}
        idPrefix={idPrefix}
        name="password"
        label="New password"
        type="password"
        autoComplete="new-password"
        description={NEW_PASSWORD_HINT}
        serverError={passwordError}
        isPlainText
      />
    </FieldGroup>
  );
}

export default SetOwnPasswordFields;
