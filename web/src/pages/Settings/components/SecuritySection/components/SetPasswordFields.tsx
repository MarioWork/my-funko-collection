import type { Control } from 'react-hook-form';
import TextField from '@components/TextField';
import { FieldGroup } from '@components/ui/field';
import { NEW_PASSWORD_HINT } from '@utils/authUtils';
import type { SetPasswordFormValues } from '../../../settingsUtils';

type Props = {
  control: Control<SetPasswordFormValues>;
  idPrefix: string;
  // The API's refusal of the password (too common), shown on its field.
  passwordError?: string;
};

function SetPasswordFields({ control, idPrefix, passwordError }: Props) {
  return (
    <FieldGroup>
      <TextField
        control={control}
        idPrefix={idPrefix}
        name="username"
        label="Username"
        autoComplete="username"
        description="Letters, digits, dots, dashes or underscores."
        isPlainText
      />
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

export default SetPasswordFields;
