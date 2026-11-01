import { KeyRound } from 'lucide-react';
import type { ReauthMethodUtil } from '@app-types/utility';
import ConfirmIdentityButtons from '@components/ConfirmIdentityButtons';
import DisabledReason from '@components/DisabledReason';
import { Button } from '@components/ui/button';
import { Spinner } from '@components/ui/spinner';
import type { ConfirmIdentityStep } from '@hooks/useConfirmIdentityStep';
import { DISABLED_REASONS, reasonWhen } from '@utils/disabledReasonUtils';

type Props = {
  formId: string;
  // The confirm step's password form, submitted by "Confirm with password".
  passwordFormId: string;
  isSaving: boolean;
  step: ConfirmIdentityStep;
  onConfirm: (method: ReauthMethodUtil) => void;
};

// The page's one wide button: save, or once the API asks for a recent sign-in, confirm with the temporary password.
function SetOwnPasswordButtons({ formId, passwordFormId, isSaving, step, onConfirm }: Props) {
  if (step.needsReauth) {
    return (
      <div className="flex flex-col gap-2 *:w-full">
        <ConfirmIdentityButtons step={step} isSaving={isSaving} passwordFormId={passwordFormId} onConfirm={onConfirm} />
      </div>
    );
  }

  return (
    <DisabledReason reason={reasonWhen(isSaving, DISABLED_REASONS.SAVING)}>
      <Button type="submit" form={formId} size="lg" className="h-12 w-full text-base" disabled={isSaving}>
        {isSaving ? <Spinner data-icon="inline-start" /> : <KeyRound data-icon="inline-start" aria-hidden="true" />}
        Save and open my collection
      </Button>
    </DisabledReason>
  );
}

export default SetOwnPasswordButtons;
