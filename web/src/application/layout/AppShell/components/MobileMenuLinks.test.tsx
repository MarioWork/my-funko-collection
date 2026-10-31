import { renderRoutes, screen } from '@test-utils';
import { UserRoleUtil } from '@app-types/utility';
import { BASE_ROUTES_PATHS } from '@application/routes/routesUtils';
import { setMockUserRole } from '@mocks/mockStore';
import MobileMenuLinks from './MobileMenuLinks';

const ADMIN_GROUP = 'Admin';

const renderPhoneMenu = () =>
  renderRoutes([{ path: BASE_ROUTES_PATHS.HOME, element: <MobileMenuLinks onNavigate={() => {}} /> }], {
    initialEntries: [BASE_ROUTES_PATHS.HOME],
  });

it('shows the Admin group in the phone menu for an admin', async () => {
  renderPhoneMenu();

  expect(await screen.findByRole('region', { name: ADMIN_GROUP })).toBeVisible();
});

it('shows a member no Admin group and no Images page in the phone menu, but keeps the manage pages', async () => {
  setMockUserRole(UserRoleUtil.MEMBER);
  renderPhoneMenu();

  expect(await screen.findByRole('link', { name: 'Series' })).toBeVisible();
  expect(screen.queryByRole('region', { name: ADMIN_GROUP })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Images' })).not.toBeInTheDocument();
});
