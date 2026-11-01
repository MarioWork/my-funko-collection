import { isRouteErrorResponse } from 'react-router';
import { FORBIDDEN_STATUS, NOT_FOUND_STATUS } from '@utils/httpStatusUtils';
import { isReadOnlyRouteError } from '@utils/readOnlyRouteUtils';
import type { ErrorCopy, ErrorKind } from './types';

export const ERROR_COPY: Record<ErrorKind, ErrorCopy> = {
  notFound: {
    label: 'Box 404',
    title: 'This shelf is empty',
    description: 'We looked in every box, but this page is not here. The link may be old or mistyped.',
  },
  adminOnly: {
    label: 'Admins only',
    title: 'This page is for admins',
    description: 'Only an admin can open it. Your collections and the catalogue are a tap away.',
  },
  readOnly: {
    label: 'Look only',
    title: 'Your account is read-only',
    description: 'An admin limited it to looking, so this page has nothing for you. Ask them if you need a change.',
  },
  broken: {
    label: 'Oops',
    title: 'Something went wrong',
    description: 'This page tripped over on the way in. Try again, or head back home.',
  },
};

// A member opened an admin-only page (Images): its loader threw a 403 route error.
function isAdminOnlyError(error: unknown): boolean {
  return isRouteErrorResponse(error) && error.status === FORBIDDEN_STATUS;
}

export function errorKindOf(error: unknown): ErrorKind {
  const isNotFound = isRouteErrorResponse(error) && error.status === NOT_FOUND_STATUS;

  if (isNotFound) return 'notFound';
  if (isReadOnlyRouteError(error)) return 'readOnly';
  if (isAdminOnlyError(error)) return 'adminOnly';

  return 'broken';
}
