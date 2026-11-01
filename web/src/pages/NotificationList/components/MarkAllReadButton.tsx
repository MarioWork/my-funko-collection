import { CheckCheck } from 'lucide-react';
import { useFetcher } from 'react-router';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import { NOTIFICATION_ROUTES_PATHS } from '@application/routes/routesUtils';
import DisabledReason from '@components/DisabledReason';
import InlineAlert from '@components/InlineAlert';
import { Button } from '@components/ui/button';
import { Spinner } from '@components/ui/spinner';
import { DISABLED_REASONS, firstReason, reasonWhen } from '@utils/disabledReasonUtils';
import { GENERIC_WRITE_ERROR } from '@utils/errorMessageUtils';

type Props = {
  hasUnread: boolean;
};

// Clears the bell's count: every notification read at once. Open to a read-only user too (it only touches their own
// notifications), so it is disabled only while there is nothing unread, or while it works.
function MarkAllReadButton({ hasUnread }: Props) {
  const fetcher = useFetcher<JSONResponseUtil>();
  const isMarking = fetcher.state !== 'idle';
  const hasFailed = fetcher.data?.success === false && !isMarking;
  const disabledReason = firstReason(
    reasonWhen(isMarking, DISABLED_REASONS.WORKING),
    reasonWhen(!hasUnread, DISABLED_REASONS.NOTHING_UNREAD),
  );

  const markAllRead = () => {
    void fetcher.submit(null, { method: HttpVerbsUtil.PATCH, action: NOTIFICATION_ROUTES_PATHS.MARK_ALL_READ });
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <DisabledReason reason={disabledReason}>
        <Button variant="outline" onClick={markAllRead} disabled={disabledReason !== undefined}>
          {isMarking ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <CheckCheck data-icon="inline-start" aria-hidden="true" />
          )}
          Mark all read
        </Button>
      </DisabledReason>
      {hasFailed ? <InlineAlert tone="error">{GENERIC_WRITE_ERROR}</InlineAlert> : null}
    </div>
  );
}

export default MarkAllReadButton;
