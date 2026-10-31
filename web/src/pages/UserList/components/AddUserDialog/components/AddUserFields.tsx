import { Controller, type Control } from 'react-hook-form';
import { USER_ROLE_LABELS, UserRoleUtil } from '@app-types/utility';
import TextField from '@components/TextField';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@components/ui/field';
import { NativeSelect, NativeSelectOption } from '@components/ui/native-select';
import type { AddUserFormValues } from '../addUserDialogUtils';

type Props = {
  control: Control<AddUserFormValues>;
  idPrefix: string;
  // The API's answer about the username (taken), shown on its field.
  usernameError?: string;
};

const ROLE_HINT = 'An admin manages users and the catalogue. A member keeps their own collections.';

function AddUserFields({ control, idPrefix, usernameError }: Props) {
  const roleId = `${idPrefix}-role`;
  const roleHintId = `${roleId}-description`;

  return (
    <FieldGroup>
      <TextField
        control={control}
        idPrefix={idPrefix}
        name="username"
        label="Username"
        autoComplete="off"
        description="What they sign in with: letters, digits, dots, dashes or underscores."
        serverError={usernameError}
        isPlainText
      />
      <Controller
        control={control}
        name="role"
        render={({ field }) => (
          <Field>
            <FieldLabel htmlFor={roleId}>Role</FieldLabel>
            <NativeSelect {...field} id={roleId} aria-describedby={roleHintId}>
              {Object.values(UserRoleUtil).map((role) => (
                <NativeSelectOption key={role} value={role}>
                  {USER_ROLE_LABELS[role]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <FieldDescription id={roleHintId}>{ROLE_HINT}</FieldDescription>
          </Field>
        )}
      />
    </FieldGroup>
  );
}

export default AddUserFields;
