import { renderRoutes, screen, userEvent, waitFor, within } from '@test-utils';
import { NotificationKindUtil, UserRoleUtil } from '@app-types/utility';
import { notificationRoutes } from '@application/routes/featureRoutes/notificationRoutes';
import {
  FUNKO_ROUTES_PATHS,
  NOTIFICATION_ROUTES_PATHS,
  SUBMISSION_ROUTES_PATHS,
} from '@application/routes/routesUtils';
import { addMockNotification, mockStore, setMockReadOnly, setMockUserRole } from '@mocks/mockStore';

const LIST_NAME = 'Your notifications';
const DESTINATION_TEXT = 'Arrived';

// The notifications page, plus stand-ins for where a notification can lead, so following a link can be seen.
const renderNotifications = () =>
  renderRoutes(
    [
      ...notificationRoutes,
      { path: SUBMISSION_ROUTES_PATHS.REVIEW, element: <p>{DESTINATION_TEXT}</p> },
      { path: SUBMISSION_ROUTES_PATHS.BASE, element: <p>{DESTINATION_TEXT}</p> },
      { path: FUNKO_ROUTES_PATHS.detail(), element: <p>{DESTINATION_TEXT}</p> },
    ],
    { initialEntries: [NOTIFICATION_ROUTES_PATHS.BASE] },
  );

function itemOf(title: string): HTMLElement {
  const item = screen.getAllByRole('listitem').find((candidate) => within(candidate).queryByText(title));

  if (!item) throw new Error(`No notification "${title}"`);

  return item;
}

function isStoredAsRead(id: number): boolean {
  return mockStore.notifications.find((row) => row.id === id)?.isRead === true;
}

it('lists an admin’s new submissions newest first, with the unread ones marked New in words', async () => {
  renderNotifications();

  const list = await screen.findByRole('list', { name: LIST_NAME });
  const titles = within(list)
    .getAllByRole('link')
    .map((link) => link.textContent);
  expect(titles).toEqual([
    'New submission: Baby Yoda',
    'New submission: Bluey',
    'New submission: Mandalorian with Grogu',
    'New submission: Thanos (Infinity Gauntlet)',
  ]);
  expect(within(itemOf('New submission: Bluey')).getByText('New')).toBeVisible();
  expect(within(itemOf('New submission: Thanos (Infinity Gauntlet)')).queryByText('New')).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'New submission: Bluey' })).toHaveAttribute(
    'href',
    SUBMISSION_ROUTES_PATHS.REVIEW,
  );
  expect(screen.getByText('2 unread notifications')).toBeVisible();
});

it('tells the sender their submission was merged, linking to the catalogue funko it went into', async () => {
  addMockNotification({ kind: NotificationKindUtil.SUBMISSION_MERGED, funkoId: 16, funkoName: 'Grogu' });

  renderNotifications();

  const link = await screen.findByRole('link', { name: 'Your submission was merged into Grogu' });
  expect(link).toHaveAttribute('href', FUNKO_ROUTES_PATHS.detail('16'));
  expect(screen.getByText(/Your items are on that funko now/)).toBeVisible();
});

it('marks a notification read and goes to what it is about when it is opened', async () => {
  const notification = addMockNotification({ kind: NotificationKindUtil.SUBMISSION_APPROVED, funkoId: 1 });
  renderNotifications();

  await userEvent.click(await screen.findByRole('link', { name: 'Sent-in funko was approved' }));

  expect(await screen.findByText(DESTINATION_TEXT)).toBeVisible();
  await waitFor(() => expect(isStoredAsRead(notification.id)).toBe(true));
});

it('shows a member why their submission was rejected and links them to their submissions', async () => {
  setMockUserRole(UserRoleUtil.MEMBER);
  addMockNotification({
    kind: NotificationKindUtil.SUBMISSION_REJECTED,
    funkoId: 1,
    funkoName: 'Bluey',
    reason: 'Please add a photo of your own box.',
  });

  renderNotifications();

  const link = await screen.findByRole('link', { name: 'Bluey was rejected' });
  expect(link).toHaveAttribute('href', SUBMISSION_ROUTES_PATHS.BASE);
  expect(within(itemOf('Bluey was rejected')).getByText('Why: Please add a photo of your own box.')).toBeVisible();
});

it('links an approval to the funko’s page', async () => {
  addMockNotification({ kind: NotificationKindUtil.SUBMISSION_APPROVED, funkoId: 4, funkoName: 'Groot' });

  renderNotifications();

  expect(await screen.findByRole('link', { name: 'Groot was approved' })).toHaveAttribute(
    'href',
    FUNKO_ROUTES_PATHS.detail('4'),
  );
});

it('offers Mark read instead of a link when the funko it is about was deleted', async () => {
  const notification = addMockNotification({ funkoId: null, funkoName: 'Gone One' });
  renderNotifications();

  await screen.findByRole('list', { name: LIST_NAME });
  const goneItem = itemOf('Gone One was approved');
  expect(within(goneItem).queryByRole('link')).not.toBeInTheDocument();
  await userEvent.click(within(goneItem).getByRole('button', { name: 'Mark read' }));

  await waitFor(() => expect(within(itemOf('Gone One was approved')).queryByText('New')).not.toBeInTheDocument());
  expect(isStoredAsRead(notification.id)).toBe(true);
});

it('tells a user a funko of theirs was removed from the catalogue, and why, with nothing to open', async () => {
  setMockUserRole(UserRoleUtil.MEMBER);
  addMockNotification({
    kind: NotificationKindUtil.FUNKO_REMOVED,
    funkoId: null,
    funkoName: 'Boba Fett (Prototype)',
    reason: 'A double of Boba Fett #08',
  });

  renderNotifications();

  await screen.findByRole('list', { name: LIST_NAME });
  const removedItem = itemOf('Boba Fett (Prototype) was removed from the catalogue');
  expect(within(removedItem).getByText('Why: A double of Boba Fett #08')).toBeVisible();
  expect(within(removedItem).queryByRole('link')).not.toBeInTheDocument();
});

it('marks every notification read with Mark all read, then says why it is disabled', async () => {
  renderNotifications();

  await userEvent.click(await screen.findByRole('button', { name: 'Mark all read' }));

  expect(await screen.findByText('All read.')).toBeVisible();
  expect(screen.queryByText('New')).not.toBeInTheDocument();
  const button = screen.getByRole('button', { name: 'Mark all read' });
  expect(button).toHaveAttribute('aria-disabled', 'true');
  expect(button).toHaveAccessibleDescription('Every notification is read already.');
});

it('lets a read-only user mark all their notifications read', async () => {
  setMockReadOnly();
  renderNotifications();

  await userEvent.click(await screen.findByRole('button', { name: 'Mark all read' }));

  expect(await screen.findByText('All read.')).toBeVisible();
});

it('shows an empty state when the user has no notifications', async () => {
  mockStore.notifications = [];

  renderNotifications();

  expect(await screen.findByRole('heading', { name: 'No notifications' })).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Mark all read' })).not.toBeInTheDocument();
});
