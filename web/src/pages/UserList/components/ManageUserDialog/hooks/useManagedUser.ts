import { useState } from 'react';
import { useParams, useRouteLoaderData } from 'react-router';
import type { UserApiModel } from '@app-types/models';
import type { LoaderDataUtil } from '@app-types/utility';
import { USER_LIST_ROUTE_ID } from '@application/routes/routesUtils';
import type { loader } from '../../../userListLoader';

// The user the dialog manages, from the Users page's own list (every user fits on its one page): no second request.
// Once deleted they leave the list, but the dialog keeps the last copy it saw until it closes, so the delete can
// finish (its toast, the way back). Undefined only for an id the list never held (a stale link).
export function useManagedUser(): UserApiModel | undefined {
  const { userId } = useParams();
  const listData = useRouteLoaderData<LoaderDataUtil<typeof loader>>(USER_LIST_ROUTE_ID);
  const listedUser = listData?.usersResponse.data.find((user) => String(user.id) === userId);
  const [lastSeenUser, setLastSeenUser] = useState(listedUser);

  // The previous-value pattern: kept in step during render, never in an effect.
  if (listedUser && listedUser !== lastSeenUser) setLastSeenUser(listedUser);

  return listedUser ?? lastSeenUser;
}
