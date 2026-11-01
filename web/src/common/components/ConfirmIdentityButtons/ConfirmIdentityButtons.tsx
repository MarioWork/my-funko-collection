import { Fingerprint, KeyRound } from 'lucide-react';
import { ReauthMethodUtil } from '@app-types/utility';
import DisabledReason from '@components/DisabledReason';
import PasskeyButton from '@components/PasskeyButton';
import { Button } from '@components/ui/button';
import { Spinner } from '@components/ui/spinner';
import type { ConfirmIdentityStep } from '@hooks/useConfirmIdentityStep';
import { DISABLED_REASONS } from '@utils/disabledReasonUtils';
import { CONFIRM_IDENTITY_COPY } from '@utils/reauthUtils';

type Props = {
  step: ConfirmIdentityStep;
  isSaving: boolean;
  // The id of the ConfirmPasswordField's form, which the password button submits.
  passwordFormId: string;
  onConfirm: (method: ReauthMethodUtil) => void;
};

type PasswordButtonProps = Pick<Props, 'isSaving' | 'passwordFormId'> & {
  isWaiting: boolean;
  hasPassword: boolean;
};

function passwordDisabledReason(isSaving: boolean, hasPassword: boolean): string | undefined {
  if (isSaving) return DISABLED_REASONS.WORKING;

  if (!hasPassword) return CONFIRM_IDENTITY_COPY.PASSWORD_MISSING_REASON;

  return undefined;
}

function PasswordButton({ isSaving, isWaiting, hasPassword, passwordFormId }: PasswordButtonProps) {
  const disabledReason = passwordDisabledReason(isSaving, hasPassword);

  return (
    <DisabledReason reason={disabledReason}>
      <Button type="submit" form={passwordFormId} disabled={disabledReason !== undefined}>
        {isWaiting ? <Spinner data-icon="inline-start" /> : <KeyRound data-icon="inline-start" aria-hidden="true" />}
        {CONFIRM_IDENTITY_COPY.PASSWORD_BUTTON}
      </Button>
    </DisabledReason>
  );
}

// The ways to confirm it's you, for a dialog's footer: a passkey (unless the page confirms with the password only), and
// the password next to it (the main button then) for a user who has one. Each shows it waits while its confirm runs.
function ConfirmIdentityButtons({ step, isSaving, passwordFormId, onConfirm }: Props) {
  const isPasswordSent = step.method === ReauthMethodUtil.PASSWORD;

  return (
    <>
      {step.canUsePasskey ? (
        <PasskeyButton
          isWaiting={isSaving && !isPasswordSent}
          isBusy={isSaving}
          isSupported
          variant={step.canUsePassword ? 'outline' : 'default'}
          icon={<Fingerprint data-icon="inline-start" aria-hidden="true" />}
          onClick={() => onConfirm(ReauthMethodUtil.PASSKEY)}
        >
          {CONFIRM_IDENTITY_COPY.BUTTON}
        </PasskeyButton>
      ) : null}
      {step.canUsePassword ? (
        <PasswordButton
          isSaving={isSaving}
          isWaiting={isSaving && isPasswordSent}
          hasPassword={step.password !== ''}
          passwordFormId={passwordFormId}
        />
      ) : null}
    </>
  );
}

export default ConfirmIdentityButtons;
