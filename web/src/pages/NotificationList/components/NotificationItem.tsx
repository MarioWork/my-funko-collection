import type { MouseEvent } from 'react';
import { Link } from 'react-router';
import type { NotificationApiModel } from '@app-types/models';
import InlineAlert from '@components/InlineAlert';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Spinner } from '@components/ui/spinner';
import { cn } from '@utils/classNameUtils';
import { formatDateTime } from '@utils/dateUtils';
import { GENERIC_WRITE_ERROR } from '@utils/errorMessageUtils';
import { useMarkRead } from '../hooks/useMarkRead';
import { NOTIFICATION_WORDING, targetOf } from '../notificationListUtils';

const TITLE_LINK_CLASS =
  'rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring';
const REASON_LABEL = 'Why:';
const NEW_LABEL = 'New';

type Props = {
  notification: NotificationApiModel;
};

type TitleProps = {
  title: string;
  target: string | undefined;
  onOpen: (event: MouseEvent) => void;
};

// A link to what it is about (marking it read on the way); plain text once that funko is gone.
function NotificationTitle({ title, target, onOpen }: TitleProps) {
  if (!target) return <span>{title}</span>;

  return (
    <Link viewTransition to={target} onClick={onOpen} className={TITLE_LINK_CLASS}>
      {title}
    </Link>
  );
}

// One notification: what happened, why (a rejection's reason), when, and "New" in words while it is unread. One
// that can't be opened any more (its funko was deleted) gets its own "Mark read".
function NotificationItem({ notification }: Props) {
  const { markRead, open, isMarking, hasFailed } = useMarkRead(notification);
  const wording = NOTIFICATION_WORDING[notification.kind];
  const target = targetOf(notification);
  const isUnread = !notification.isRead;
  const Icon = wording.icon;

  return (
    <li className="flex items-start gap-3 py-3">
      <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className={cn('text-sm', isUnread && 'font-semibold')}>
          <NotificationTitle title={wording.title(notification.funkoName)} target={target} onOpen={open} />
        </p>
        <p className="text-sm text-muted-foreground">
          {notification.reason ? `${REASON_LABEL} ${notification.reason}` : wording.detail}
        </p>
        <time dateTime={notification.createdAt} className="text-xs text-muted-foreground">
          {formatDateTime(notification.createdAt)}
        </time>
        {hasFailed ? <InlineAlert tone="error">{GENERIC_WRITE_ERROR}</InlineAlert> : null}
      </div>
      {isUnread ? (
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Badge>{NEW_LABEL}</Badge>
          {target ? null : (
            <Button variant="ghost" size="sm" onClick={markRead} disabled={isMarking}>
              {isMarking ? <Spinner data-icon="inline-start" /> : null}
              Mark read
            </Button>
          )}
        </div>
      ) : null}
    </li>
  );
}

export default NotificationItem;
