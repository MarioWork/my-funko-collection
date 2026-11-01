import { useFetcher } from 'react-router';
import type { NotificationApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import { NOTIFICATION_ROUTES_PATHS } from '@application/routes/routesUtils';

// Marks one notification read. Opening it calls this as the link navigates: the fetcher outlives the page it came
// from, and the shell's count reloads once it settles. Nothing is sent for one that is read already.
export function useMarkRead(notification: NotificationApiModel) {
  const fetcher = useFetcher<JSONResponseUtil<NotificationApiModel>>();
  const isMarking = fetcher.state !== 'idle';

  const markRead = () => {
    if (notification.isRead) return;

    void fetcher.submit(null, {
      method: HttpVerbsUtil.PATCH,
      action: NOTIFICATION_ROUTES_PATHS.markRead(String(notification.id)),
    });
  };

  return { markRead, isMarking };
}
