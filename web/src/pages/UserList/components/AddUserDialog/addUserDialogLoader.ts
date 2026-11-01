import type { LoaderFunctionArgs } from 'react-router';
import { assertAdmin } from '@utils/adminRouteUtils';
import { assertCanWrite } from '@utils/readOnlyRouteUtils';

// Nothing to load: the dialog only creates. A read-only admin opening its URL gets the "read-only" error page.
export function loader({ context }: LoaderFunctionArgs) {
  assertAdmin(context);
  assertCanWrite(context);

  return null;
}
