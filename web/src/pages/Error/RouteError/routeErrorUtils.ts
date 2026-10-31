import { isRouteErrorResponse } from 'react-router';
import { AuthApiErrorCodes } from '@services/authService/authService';

export type ErrorKind = 'notFound' | 'adminOnly' | 'broken';

// The part of a failed read's error the boundary looks at: the API's error code, never the rest.
type ApiErrorShape = { response?: { data?: { code?: unknown } } };

export type ErrorCopy = {
  // The storage-box label on the figure, as a tag reads "Box 3".
  label: string;
  title: string;
  description: string;
};

const NOT_FOUND_STATUS = 404;

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
  broken: {
    label: 'Oops',
    title: 'Something went wrong',
    description: 'This page tripped over on the way in. Try again, or head back home.',
  },
};

// A member opened an admin-only page (Images): its read answered 403 ADMIN_ONLY.
function isAdminOnlyError(error: unknown): boolean {
  return (error as ApiErrorShape | null)?.response?.data?.code === AuthApiErrorCodes.ADMIN_ONLY;
}

export function errorKindOf(error: unknown): ErrorKind {
  const isNotFound = isRouteErrorResponse(error) && error.status === NOT_FOUND_STATUS;

  if (isNotFound) return 'notFound';
  if (isAdminOnlyError(error)) return 'adminOnly';

  return 'broken';
}
