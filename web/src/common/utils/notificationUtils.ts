// Notification counts in words, shared by the bell, its live region and the notifications page.

function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}

// "1 unread", "3 unread": the bell's accessible name after "Notifications, ".
export function describeUnreadCount(count: number): string {
  return `${count} unread`;
}

// The unread count in a sentence, for the live region (when it goes up) and the page header:
// "1 unread notification", "3 unread notifications".
export function describeUnreadNotifications(count: number): string {
  return `${count} unread ${plural(count, 'notification', 'notifications')}`;
}
