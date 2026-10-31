import {
  ADD_ROUTES_PATHS,
  AUTH_ROUTES_PATHS,
  AUTH_SEARCH_PARAMS,
  BASE_ROUTES_PATHS,
  CATEGORY_ROUTES_PATHS,
  COLLECTION_ROUTES_PATHS,
  defaultRedirectRoute,
  FUNKO_ROUTES_PATHS,
  IMAGE_ROUTES_PATHS,
  ITEM_ROUTES_PATHS,
  SERIES_ROUTES_PATHS,
  TAG_ROUTES_PATHS,
} from '@application/routes/routesUtils';
import { HttpVerbsUtil } from '@app-types/utility';

// The router's basename without its trailing slash: '' when the app is served from the root.
const BASE_PATH = (import.meta.env.VITE_PROJECT_PATH || BASE_ROUTES_PATHS.ROOT).replace(/\/$/, '');

// The app's own pages, from the route constants: a redirect may only land on one of these (or a page below it).
const APP_PAGE_PATHS = [
  BASE_ROUTES_PATHS.HOME,
  BASE_ROUTES_PATHS.SEARCH,
  BASE_ROUTES_PATHS.SETTINGS,
  FUNKO_ROUTES_PATHS.BASE,
  ADD_ROUTES_PATHS.BASE,
  COLLECTION_ROUTES_PATHS.BASE,
  ITEM_ROUTES_PATHS.BASE,
  CATEGORY_ROUTES_PATHS.BASE,
  SERIES_ROUTES_PATHS.BASE,
  IMAGE_ROUTES_PATHS.BASE,
  TAG_ROUTES_PATHS.BASE,
];

// HttpVerbsUtil has no HEAD: it is a read, like GET.
const HEAD_METHOD = 'HEAD';
const SAFE_METHODS: string[] = [HttpVerbsUtil.GET, HEAD_METHOD];

function isAppPage(pathname: string): boolean {
  return APP_PAGE_PATHS.some((pagePath) => pathname === pagePath || pathname.startsWith(`${pagePath}/`));
}

// A request's address inside the app (basename removed), which is what redirect() and navigate() expect.
export function appPathOf(url: URL): string {
  const isUnderBasePath = BASE_PATH !== '' && url.pathname.startsWith(BASE_PATH);
  const pathname = isUnderBasePath ? url.pathname.slice(BASE_PATH.length) || BASE_ROUTES_PATHS.ROOT : url.pathname;

  return `${pathname}${url.search}`;
}

// `redirectTo` comes from the url, so it is never followed as given: it must be a path to one of the app's own
// pages (checked against the route constants above), never another site ('//evil.example', 'https://...'), a
// script ('javascript:...') or a sign-in page. Anything else falls back to Home.
export function safeRedirectPath(value: string | null | undefined): string {
  if (!value) return defaultRedirectRoute;

  const isRootRelative = value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\');
  const pathname = value.split(/[?#]/)[0] ?? '';

  if (!isRootRelative || !isAppPage(pathname)) return defaultRedirectRoute;

  return value;
}

// Where to come back to after signing in. A page load or navigation asks for its own address. A write (a fetcher
// submitting to an action route such as /tags/3) was made from the page on screen, so that page is the one to
// return to.
export function returnPathOf(request: Request): string {
  const isNavigation = SAFE_METHODS.includes(request.method);
  const pageUrl = isNavigation ? new URL(request.url) : new URL(window.location.href);

  return appPathOf(pageUrl);
}

// The login page, remembering where to come back to (left out when that is just the start page).
export function loginPathFor(redirectTo: string): string {
  const isStartPage = redirectTo === BASE_ROUTES_PATHS.ROOT || redirectTo === defaultRedirectRoute;

  if (isStartPage) return AUTH_ROUTES_PATHS.LOGIN;

  const params = new URLSearchParams({ [AUTH_SEARCH_PARAMS.REDIRECT_TO]: redirectTo });

  return `${AUTH_ROUTES_PATHS.LOGIN}?${params.toString()}`;
}

// Where a signed-in user goes from the login page: the page they came for, or Home.
export function redirectTargetOf(url: URL): string {
  return safeRedirectPath(url.searchParams.get(AUTH_SEARCH_PARAMS.REDIRECT_TO));
}
