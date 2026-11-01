import { redirect, type DataStrategyResult, type MiddlewareFunction } from 'react-router';
import {
  isAdminOnlyFailure,
  isPasswordChangeFailure,
  isReadOnlyFailure,
  isUnauthorizedFailure,
} from '@api/axiosActions';
import { loginPathFor, returnPathOf } from '@utils/authRedirectUtils';
import { AUTH_ROUTES_PATHS } from './routesUtils';
import { forgetSignedInUser } from './signedInUserMiddleware';

type RouteResults = Record<string, DataStrategyResult>;

function isRouteResults(value: unknown): value is RouteResults {
  return typeof value === 'object' && value !== null;
}

type FailureCheck = (value: unknown) => boolean;

function hasResult(results: RouteResults, isFailure: FailureCheck): boolean {
  return Object.values(results).some((routeResult) => isFailure(routeResult?.result));
}

// Every route whose result is that failure gets a redirect to `path` instead; the others keep their result.
function redirectEach(results: RouteResults, isFailure: FailureCheck, path: string): RouteResults {
  const entries = Object.entries(results).map(([routeId, routeResult]) => {
    if (!isFailure(routeResult?.result)) return [routeId, routeResult];

    // One Response per route: the router rewrites a redirect's Location header in place.
    return [routeId, { type: 'data', result: redirect(path) }];
  });

  return Object.fromEntries(entries) as RouteResults;
}

// Root middleware: the one place a lost session is noticed. It lets every loader and action run, then turns each
// "no valid session" answer (a read that threw a 401, an action's UNAUTHORIZED envelope) into a redirect to the
// login page that remembers where the user was. React Router follows a redirect for a navigation and for a fetcher
// alike, so neither the error page nor an inline "something went wrong" ever shows for an expired sign-in.
export const authMiddleware: MiddlewareFunction = async ({ request }, next) => {
  const results = await next();

  if (!isRouteResults(results)) return results;

  // The API refused an admin-only call: the user is no longer an admin, so the next request asks who they are again.
  if (hasResult(results, isAdminOnlyFailure)) forgetSignedInUser();

  // The API refused a write as read-only: the next request asks again, so the app shows the writes disabled.
  if (hasResult(results, isReadOnlyFailure)) forgetSignedInUser();

  // The API wants the temporary password replaced first: there, and nowhere else.
  if (hasResult(results, isPasswordChangeFailure)) {
    forgetSignedInUser();

    return redirectEach(results, isPasswordChangeFailure, AUTH_ROUTES_PATHS.SET_PASSWORD);
  }

  if (!hasResult(results, isUnauthorizedFailure)) return results;

  // The session is gone: whoever signs in next is asked for again.
  forgetSignedInUser();

  return redirectEach(results, isUnauthorizedFailure, loginPathFor(returnPathOf(request)));
};
