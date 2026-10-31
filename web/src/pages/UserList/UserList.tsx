import { UserPlus } from 'lucide-react';
import { Outlet, useLoaderData } from 'react-router';
import type { LoaderDataUtil } from '@app-types/utility';
import { USER_ROUTES_PATHS } from '@application/routes/routesUtils';
import LinkButton from '@components/LinkButton';
import PageHeader from '@components/PageHeader';
import { useMobileChildPage } from '@hooks/useMobileChildPage';
import { PAGE_ICONS } from '@utils/navigationUtils';
import UserTable from './components/UserTable';
import type { loader } from './userListLoader';
import { describeUserCount } from './userListUtils';

// Admins only: everyone who can use the app, with their role and how they sign in today. "New user" opens the
// create dialog over the list (its own page on phones).
function UserList() {
  const childPage = useMobileChildPage();
  const { usersResponse } = useLoaderData<LoaderDataUtil<typeof loader>>();

  if (childPage) return childPage;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        icon={PAGE_ICONS.USERS}
        title="Users"
        description={describeUserCount(usersResponse.totalResultNumber)}
        actions={
          <LinkButton to={USER_ROUTES_PATHS.ADD}>
            <UserPlus data-icon="inline-start" aria-hidden="true" />
            New user
          </LinkButton>
        }
      />
      <div className="rounded-xl border bg-card p-4">
        <UserTable users={usersResponse.data} />
      </div>
      <Outlet />
    </div>
  );
}

export default UserList;
