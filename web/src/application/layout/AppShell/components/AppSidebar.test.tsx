import { renderRoutes, screen, within } from '@test-utils';
import { UserRoleUtil } from '@app-types/utility';
import { BASE_ROUTES_PATHS, IMAGE_ROUTES_PATHS } from '@application/routes/routesUtils';
import { SidebarProvider } from '@components/ui/sidebar';
import { setMockUserRole } from '@mocks/mockStore';
import AppSidebar from './AppSidebar';
import MobileMenuLinks from './MobileMenuLinks';

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

const renderPhoneMenu = () =>
  renderRoutes([{ path: BASE_ROUTES_PATHS.HOME, element: <MobileMenuLinks onNavigate={() => {}} /> }], {
    initialEntries: [BASE_ROUTES_PATHS.HOME],
  });

it('puts the Images page in an Admin group for an admin', async () => {
  renderSidebar();

  const adminGroup = await screen.findByRole('list', { name: ADMIN_GROUP });

  expect(within(adminGroup).getByRole('link', { name: 'Images' })).toHaveAttribute('href', IMAGE_ROUTES_PATHS.BASE);
});

it('shows a member no Admin group and no Images page, but keeps the manage pages', async () => {
  setMockUserRole(UserRoleUtil.MEMBER);
  renderSidebar();

  expect(await screen.findByRole('link', { name: 'Categories' })).toBeVisible();
  expect(screen.queryByRole('list', { name: ADMIN_GROUP })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Images' })).not.toBeInTheDocument();
});

it('shows the Admin group in the phone menu for an admin only', async () => {
  const { unmount } = renderPhoneMenu();

  expect(await screen.findByRole('region', { name: ADMIN_GROUP })).toBeVisible();
  unmount();

  setMockUserRole(UserRoleUtil.MEMBER);
  renderPhoneMenu();

  expect(await screen.findByRole('link', { name: 'Series' })).toBeVisible();
  expect(screen.queryByRole('region', { name: ADMIN_GROUP })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Images' })).not.toBeInTheDocument();
});
