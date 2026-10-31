import type { LoaderFunctionArgs } from 'react-router';
import { signedInUserContext } from '@application/routes/signedInUserMiddleware';

// The signed-in user, for useSignedInUser and useIsAdmin. The shell route's signedInUserMiddleware has already
// checked the session (and sent anyone else to the setup or login page) and put the user in the router context.
export function loader({ context }: LoaderFunctionArgs) {
  return { user: context.get(signedInUserContext) };
}
