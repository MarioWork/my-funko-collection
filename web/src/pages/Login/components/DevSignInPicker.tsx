import { USER_ROLE_LABELS } from '@app-types/utility';
import DisabledReason from '@components/DisabledReason';
import { Field, FieldDescription, FieldLabel } from '@components/ui/field';
import { NativeSelect, NativeSelectOption } from '@components/ui/native-select';
import { DISABLED_REASONS, reasonWhen } from '@utils/disabledReasonUtils';
import { DEV_SIGN_IN_PASSWORD } from '@utils/devPasswordUtils';
import { DEV_PERSONAS, type DevPersona } from '@utils/devSignInUtils';
import type { PasswordSignInFormValues } from '../loginUtils';

type Props = {
  isSigningIn: boolean;
  onPick: (credentials: PasswordSignInFormValues) => void;
};

const PICKER_ID = 'dev-sign-in-as';
const DESCRIPTION_ID = `${PICKER_ID}-description`;
const NO_PICK = '';

// "poe - Member (read-only)", "finn - Member (temporary password)".
function personaLabel({ username, role, isReadOnly, hasTemporaryPassword }: DevPersona): string {
  const readOnly = isReadOnly ? ' (read-only)' : '';
  const temporaryPassword = hasTemporaryPassword ? ' (temporary password)' : '';

  return `${username} - ${USER_ROLE_LABELS[role]}${readOnly}${temporaryPassword}`;
}

// Only in `yarn dev` (PasswordSignInForm renders it under import.meta.env.DEV, so a build has none of it). Picking a
// seeded user hands their username and the shared dev password to the form, which signs in the normal way: the
// password route, on the real API or the mocks alike. Never a way around signing in.
function DevSignInPicker({ isSigningIn, onPick }: Props) {
  const pick = (username: string) => {
    if (username !== NO_PICK) onPick({ username, password: DEV_SIGN_IN_PASSWORD });
  };

  return (
    <Field>
      <FieldLabel htmlFor={PICKER_ID}>Sign in as…</FieldLabel>
      <DisabledReason
        reason={reasonWhen(isSigningIn, DISABLED_REASONS.SIGNING_IN)}
        mode="wrapper"
        wrapperClassName="flex w-full"
      >
        <NativeSelect
          id={PICKER_ID}
          className="w-full"
          value={NO_PICK}
          onChange={(event) => pick(event.target.value)}
          disabled={isSigningIn}
          aria-describedby={DESCRIPTION_ID}
        >
          <NativeSelectOption value={NO_PICK}>Pick a seeded user</NativeSelectOption>
          {DEV_PERSONAS.map((persona) => (
            <NativeSelectOption key={persona.username} value={persona.username}>
              {personaLabel(persona)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </DisabledReason>
      <FieldDescription id={DESCRIPTION_ID}>Fills in the form with the dev password and signs in.</FieldDescription>
    </Field>
  );
}

export default DevSignInPicker;
