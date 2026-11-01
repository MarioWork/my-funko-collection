import { Send } from 'lucide-react';
import type { ApiError } from '@app-types/models';
import DisabledReason from '@components/DisabledReason';
import InlineAlert from '@components/InlineAlert';
import { Button } from '@components/ui/button';
import { Spinner } from '@components/ui/spinner';
import { DISABLED_REASONS, reasonWhen } from '@utils/disabledReasonUtils';
import { GENERIC_WRITE_ERROR } from '@utils/errorMessageUtils';

type Props = {
  isSending: boolean;
  // Another submission is being sent: one at a time.
  isBusy: boolean;
  failure: ApiError | undefined;
  onResend: () => void;
};

// A rejected submission goes back to the admins, fixed on its page first (or as it was). A clash with another of
// the member's waiting ones, or with the catalogue, shows here.
function ResendSubmissionButton({ isSending, isBusy, failure, onResend }: Props) {
  return (
    <div className="flex flex-col items-start gap-2">
      <DisabledReason reason={reasonWhen(isBusy, DISABLED_REASONS.WORKING)}>
        <Button variant="outline" size="sm" onClick={onResend} disabled={isBusy}>
          {isSending ? <Spinner data-icon="inline-start" /> : <Send data-icon="inline-start" aria-hidden="true" />}
          Send again
        </Button>
      </DisabledReason>
      {failure ? <InlineAlert tone="error">{failure.message ?? GENERIC_WRITE_ERROR}</InlineAlert> : null}
    </div>
  );
}

export default ResendSubmissionButton;
