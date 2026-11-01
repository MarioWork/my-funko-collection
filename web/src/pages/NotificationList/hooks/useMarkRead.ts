import type { MouseEvent } from 'react';
import { useFetcher } from 'react-router';
import type { NotificationApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import { NOTIFICATION_ROUTES_PATHS } from '@application/routes/routesUtils';
import { createFormData } from '@utils/formDataUtils';

const PRIMARY_BUTTON = 0;

// A plain click: not a middle click, and no key held for a new tab or window, which the link handles itself.
function isPlainClick(event: MouseEvent): boolean {
  const hasModifier = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;

  return event.button === PRIMARY_BUTTON && !hasModifier;
}

// Marking one notification read. Opening an unread one goes through the action, which marks it read and then
// redirects to the link's target, so the bell's count reloads after the write, never before it. A middle click or
// "open in new tab" follows the link as it is, leaving the notification unread. A read one is just a link.
export function useMarkRead(notification: NotificationApiModel) {
  const fetcher = useFetcher<JSONResponseUtil<NotificationApiModel>>();
  const isMarking = fetcher.state !== 'idle';
  const hasFailed = fetcher.data?.success === false && !isMarking;
  const action = NOTIFICATION_ROUTES_PATHS.markRead(String(notification.id));

  const markRead = () => {
    void fetcher.submit(null, { method: HttpVerbsUtil.PATCH, action });
  };

  const open = (event: MouseEvent) => {
    if (notification.isRead || !isPlainClick(event)) return;

    event.preventDefault();
    void fetcher.submit(createFormData({ isOpening: true }), { method: HttpVerbsUtil.PATCH, action });
  };

  return { markRead, open, isMarking, hasFailed };
}
