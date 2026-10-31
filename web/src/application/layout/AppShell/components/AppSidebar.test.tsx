import { renderRoutes, screen, within } from '@test-utils';
import { UserRoleUtil } from '@app-types/utility';
import { BASE_ROUTES_PATHS, IMAGE_ROUTES_PATHS, USER_ROUTES_PATHS } from '@application/routes/routesUtils';
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

it('puts the Users and Images pages in an Admin group for an admin', async () => {
  renderSidebar();

  const adminGroup = await screen.findByRole('list', { name: ADMIN_GROUP });

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
