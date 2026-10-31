import { redirect, type DataStrategyResult, type MiddlewareFunction } from 'react-router';
import { isUnauthorizedFailure } from '@api/axiosActions';
import { loginPathFor, returnPathOf } from '@utils/authRedirectUtils';
import { forgetSignedInUser } from './signedInUserMiddleware';

type RouteResults = Record<string, DataStrategyResult>;

function isRouteResults(value: unknown): value is RouteResults {
  return typeof value === 'object' && value !== null;
}

function hasUnauthorizedResult(results: RouteResults): boolean {
  return Object.values(results).some((routeResult) => isUnauthorizedFailure(routeResult?.result));
}

// Root middleware: the one place a lost session is noticed. It lets every loader and action run, then turns each
// "no valid session" answer (a read that threw a 401, an action's UNAUTHORIZED envelope) into a redirect to the
// login page that remembers where the user was. React Router follows a redirect for a navigation and for a fetcher
// alike, so neither the error page nor an inline "something went wrong" ever shows for an expired sign-in.
export const authMiddleware: MiddlewareFunction = async ({ request }, next) => {
  const results = await next();

  if (!isRouteResults(results) || !hasUnauthorizedResult(results)) return results;

  // The session is gone: whoever signs in next is asked for again.
  forgetSignedInUser();

  const loginPath = loginPathFor(returnPathOf(request));
  const entries = Object.entries(results).map(([routeId, routeResult]) => {
    if (!isUnauthorizedFailure(routeResult?.result)) return [routeId, routeResult];

    // One Response per route: the router rewrites a redirect's Location header in place.
    return [routeId, { type: 'data', result: redirect(loginPath) }];
  });

  return Object.fromEntries(entries) as RouteResults;
};
