import { act, renderRoutes, screen, waitFor } from '@test-utils';
import { BASE_ROUTES_PATHS } from '@application/routes/routesUtils';
import { addMockNotification } from '@mocks/mockStore';
import NotificationBell from './NotificationBell';
import NotificationAnnouncer from './NotificationAnnouncer';

// The bell shows when the first count has arrived; the announcer sits beside it, as in the shell.
const renderAnnouncer = () =>
  renderRoutes(
    [
      {
        path: BASE_ROUTES_PATHS.HOME,
        element: (
          <>
            <NotificationBell />
            <NotificationAnnouncer />
          </>
        ),
      },
    ],
    { initialEntries: [BASE_ROUTES_PATHS.HOME] },
  );

it('says nothing about the count the page opens with', async () => {
  renderAnnouncer();

  await screen.findByRole('link', { name: 'Notifications, 2 unread' });

  expect(screen.getByRole('status')).toBeEmptyDOMElement();
});

it('says the new count politely when it goes up after a reload', async () => {
  const { router } = renderAnnouncer();
  await screen.findByRole('link', { name: 'Notifications, 2 unread' });

  addMockNotification();
  await act(() => router.revalidate());

  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('3 unread notifications'));
  expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
});
