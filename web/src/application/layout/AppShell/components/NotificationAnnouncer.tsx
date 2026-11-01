import { useState } from 'react';
import { describeUnreadNotifications } from '@utils/notificationUtils';
import UnreadCountAwait from './UnreadCountAwait';

type Props = {
  count: number | undefined;
};

// Says the unread count once it goes up after the first load ("2 unread notifications"), politely, and nothing when
// it stays the same or drops (the user read one). The shell reloads the count on every page change, so speaking on
// every load would repeat it at each click; the bell's own name always carries the number for anyone who looks.
function CountAnnouncement({ count }: Props) {
  const [previousCount, setPreviousCount] = useState(count);
  const [announcement, setAnnouncement] = useState('');

  // An unknown count (one that failed to load) is skipped, so the next known one is still compared with the last.
  const isNewKnownCount = count !== undefined && count !== previousCount;

  if (isNewKnownCount) {
    const hasGoneUp = previousCount !== undefined && count > previousCount;

    setPreviousCount(count);

    if (hasGoneUp) setAnnouncement(describeUnreadNotifications(count));
  }

  return (
    <div role="status" aria-live="polite" className="sr-only">
      {announcement}
    </div>
  );
}

// One polite live region for the whole shell, beside both bells (sidebar and header).
function NotificationAnnouncer() {
  return <UnreadCountAwait>{(count) => <CountAnnouncement count={count} />}</UnreadCountAwait>;
}

export default NotificationAnnouncer;
