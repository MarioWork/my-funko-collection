import { renderRoutes, screen, within } from '@test-utils';
import { UserRoleUtil } from '@app-types/utility';
import {
  BASE_ROUTES_PATHS,
  IMAGE_ROUTES_PATHS,
  NOTIFICATION_ROUTES_PATHS,
  SUBMISSION_ROUTES_PATHS,
  USER_ROUTES_PATHS,
} from '@application/routes/routesUtils';
import { SidebarProvider } from '@components/ui/sidebar';
import { setMockUserRole } from '@mocks/mockStore';
import AppSidebar from './AppSidebar';

const ADMIN_GROUP = 'Admin';

const renderSidebar = () =>
  renderRoutes(
    [
      {
        path: BASE_ROUTES_PATHS.HOME,
        element: (
          <SidebarProvider>
            <AppSidebar />
          </SidebarProvider>
        ),
      },
    ],
    { initialEntries: [BASE_ROUTES_PATHS.HOME] },
  );

it('puts the Submissions review, Users and Images pages in an Admin group for an admin', async () => {
  renderSidebar();

  const adminGroup = await screen.findByRole('list', { name: ADMIN_GROUP });

  expect(within(adminGroup).getByRole('link', { name: 'Submissions' })).toHaveAttribute(
    'href',
    SUBMISSION_ROUTES_PATHS.REVIEW,
  );
  expect(within(adminGroup).getByRole('link', { name: 'Users' })).toHaveAttribute('href', USER_ROUTES_PATHS.BASE);
  expect(within(adminGroup).getByRole('link', { name: 'Images' })).toHaveAttribute('href', IMAGE_ROUTES_PATHS.BASE);
});

it('shows a member no Admin group and no Users or Images page, but keeps the manage pages', async () => {
  setMockUserRole(UserRoleUtil.MEMBER);
  renderSidebar();

  expect(await screen.findByRole('link', { name: 'Categories' })).toBeVisible();
  expect(screen.queryByRole('list', { name: ADMIN_GROUP })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Images' })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Users' })).not.toBeInTheDocument();
});

it('gives a member a Submissions page beside the manage pages', async () => {
  setMockUserRole(UserRoleUtil.MEMBER);
  renderSidebar();

  expect(await screen.findByRole('link', { name: 'Submissions' })).toHaveAttribute(
    'href',
    SUBMISSION_ROUTES_PATHS.BASE,
  );
});

it('gives an admin only the review Submissions page: their own new funkos join the catalogue at once', async () => {
  renderSidebar();

  expect(await screen.findByRole('link', { name: 'Categories' })).toBeVisible();
  expect(screen.getAllByRole('link', { name: 'Submissions' }).map((link) => link.getAttribute('href'))).toEqual([
    SUBMISSION_ROUTES_PATHS.REVIEW,
  ]);
});

it('puts a bell at the top that names how many notifications are unread and opens them', async () => {
  renderSidebar();

  const bell = await screen.findByRole('link', { name: 'Notifications, 2 unread' });

  expect(bell).toHaveAttribute('href', NOTIFICATION_ROUTES_PATHS.BASE);
  expect(within(bell).getByText('2')).toBeVisible();
});
