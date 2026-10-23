import { Cloud, KeyRound, Smartphone } from 'lucide-react';
import type { PasskeyApiModel } from '@app-types/models';
import DisabledReason from '@components/DisabledReason';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { formatDate } from '@utils/dateUtils';
import { LAST_PASSKEY_REASON } from '../../../settingsUtils';

type Props = {
  passkey: PasskeyApiModel;
  isLastPasskey: boolean;
  onRemove: (passkey: PasskeyApiModel) => void;
};

type SyncBadgeProps = {
  isSynced: boolean;
};

// Text, not only an icon or a colour: "Synced" (a passkey manager keeps a copy) or "One device only" (it lives on a single device or security key).
function SyncBadge({ isSynced }: SyncBadgeProps) {
  if (isSynced) {
    return (
      <Badge variant="secondary">
        <Cloud data-icon="inline-start" aria-hidden="true" />
        Synced
      </Badge>
    );
  }

  return (
    <Badge variant="outline">
      <Smartphone data-icon="inline-start" aria-hidden="true" />
      One device only
    </Badge>
  );
}

function PasskeyRow({ passkey, isLastPasskey, onRemove }: Props) {
  const lastUsed = passkey.lastUsedAt ? `Last used ${formatDate(passkey.lastUsedAt)}` : 'Never used';

  return (
    <li className="flex items-center gap-3 rounded-xl border p-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-soft-foreground">
        <KeyRound className="size-4" aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-medium">{passkey.name}</span>
          <SyncBadge isSynced={passkey.isSynced} />
        </div>
        <p className="flex flex-wrap gap-x-1.5 text-xs text-muted-foreground">
          <span>Added {formatDate(passkey.createdAt)}</span>
          <span aria-hidden="true">·</span>
          <span>{lastUsed}</span>
        </p>
      </div>
      <DisabledReason reason={isLastPasskey ? LAST_PASSKEY_REASON : undefined}>
        <Button
          variant="ghost"
          size="sm"
          aria-label={`Remove ${passkey.name}`}
          disabled={isLastPasskey}
          onClick={() => onRemove(passkey)}
        >
          Remove
        </Button>
      </DisabledReason>
    </li>
  );
}

export default PasskeyRow;
