import { Suspense, type ReactNode } from 'react';
import { Await, useRouteLoaderData } from 'react-router';
import type { LoaderDataUtil } from '@app-types/utility';
import { APP_SHELL_ROUTE_ID } from '@application/routes/routesUtils';
import type { loader } from '../appShellLoader';

type Props = {
  // What to show for the count: undefined while it loads for the first time, or when it could not be read.
  children: (count: number | undefined) => ReactNode;
};

// The bell's unread count from the shell's loader, which leaves it as a promise. Once shown, a newer count replaces
// it without falling back to "unknown" (navigations run in a transition); a count the loader could not read (null)
// shows as unknown.
function UnreadCountAwait({ children }: Props) {
  const shellData = useRouteLoaderData<LoaderDataUtil<typeof loader>>(APP_SHELL_ROUTE_ID);
  const unknown = children(undefined);

  if (!shellData) return unknown;

  return (
    <Suspense fallback={unknown}>
      <Await resolve={shellData.unreadCount} errorElement={unknown}>
        {(unread) => children(unread?.count)}
      </Await>
    </Suspense>
  );
}

export default UnreadCountAwait;
