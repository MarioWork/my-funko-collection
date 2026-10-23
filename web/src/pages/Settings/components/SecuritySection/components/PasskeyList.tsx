import { Plus } from 'lucide-react';
import type { PasskeyApiModel } from '@app-types/models';
import DisabledReason from '@components/DisabledReason';
import { Button } from '@components/ui/button';
import { DISABLED_REASONS } from '@utils/disabledReasonUtils';
import { isPasskeySupported } from '@utils/passkeyUtils';
import PasskeyRow from './PasskeyRow';

type Props = {
  passkeys: PasskeyApiModel[];
  onAdd: () => void;
  onRemove: (passkey: PasskeyApiModel) => void;
};

type AddPasskeyButtonProps = {
  onAdd: () => void;
};

const HEADING_ID = 'security-passkeys';

function AddPasskeyButton({ onAdd }: AddPasskeyButtonProps) {
  const isSupported = isPasskeySupported();

  return (
    <DisabledReason reason={isSupported ? undefined : DISABLED_REASONS.PASSKEY_UNSUPPORTED}>
      <Button variant="secondary" className="self-start" disabled={!isSupported} onClick={onAdd}>
        <Plus data-icon="inline-start" aria-hidden="true" />
        Add a passkey
      </Button>
    </DisabledReason>
  );
}

// The passkeys that can sign in. The last one cannot be removed: its button stays, disabled with the reason.
function PasskeyList({ passkeys, onAdd, onRemove }: Props) {
  const isLastPasskey = passkeys.length <= 1;

  return (
    <div className="flex flex-col gap-2">
      <h3 id={HEADING_ID} className="text-sm font-medium">
        Passkeys
      </h3>
      <ul aria-labelledby={HEADING_ID} className="flex flex-col gap-2">
        {passkeys.map((passkey) => (
          <PasskeyRow key={passkey.id} passkey={passkey} isLastPasskey={isLastPasskey} onRemove={onRemove} />
        ))}
      </ul>
      <AddPasskeyButton onAdd={onAdd} />
    </div>
  );
}

export default PasskeyList;
