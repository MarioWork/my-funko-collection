import {
  act,
  configure,
  render,
  renderHook,
  screen,
  waitFor,
  within,
  type RenderOptions,
} from '@testing-library/react';
import userEventBase from '@testing-library/user-event';
import { createMemoryRouter, type RouteObject } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { APP_SHELL_ROUTE_ID } from '@application/routes/routesUtils';
import { mockUserOf } from '@mocks/handlers/auth/authMockUtils';
import { mockStore } from '@mocks/mockStore';

const ASYNC_QUERY_TIMEOUT_MS = 5000;

// The 1 s default is too short for a cold first render behind the mocks' delay.
configure({ asyncUtilTimeout: ASYNC_QUERY_TIMEOUT_MS });

// `delay: null` drops the waits between key presses.
export const userEvent = userEventBase.setup({ delay: null });

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

export function deferred<T>(): Deferred<T> {
  const settlers: Pick<Deferred<T>, 'resolve' | 'reject'> = { resolve: () => {}, reject: () => {} };

  const promise = new Promise<T>((resolve, reject) => {
    settlers.resolve = resolve;
    settlers.reject = reject;
  });

  return { promise, ...settlers };
}

type RenderRoutesOptions = RenderOptions & { initialEntries?: string[] };

// React Router clears each resolved entry of an object-form `lazy` ({ action: () => import(...) }) in place, on
// the route table's own object. A table shared by several tests would lose its actions after the first, so every
// render gets its own copies.
function withFreshLazy(routes: RouteObject[]): RouteObject[] {
  return routes.map((route) => {
    const lazy = typeof route.lazy === 'object' ? { ...route.lazy } : route.lazy;
    const children = route.children ? withFreshLazy(route.children) : undefined;

    return { ...route, lazy, children } as RouteObject;
  });
}

// A stand-in for the app shell around the pages under test: it holds the signed-in user (useSignedInUser,
// useIsAdmin) the way the real shell's loader does, read from the mock store at load time. An admin unless the
// test called setMockUserRole().
export function shellRoute(children: RouteObject[]): RouteObject {
  return { id: APP_SHELL_ROUTE_ID, loader: () => ({ user: mockUserOf(mockStore.auth) }), children };
}

function hasShellRoute(routes: RouteObject[]): boolean {
  return routes.some((route) => route.id === APP_SHELL_ROUTE_ID || hasShellRoute(route.children ?? []));
}

// A table that brings its own shell route (the app's, or shellRoute() placed by the test) keeps it.
function withShell(routes: RouteObject[]): RouteObject[] {
  if (hasShellRoute(routes)) return routes;

  return [shellRoute(routes)];
}

// Real route objects, so a page's loader and action run as they do in the app. The router comes back too, for a
// test that navigates or reads the current location.
export function renderRoutes(routes: RouteObject[], { initialEntries = ['/'], ...options }: RenderRoutesOptions = {}) {
  const router = createMemoryRouter(withShell(withFreshLazy(routes)), { initialEntries });

  return { ...render(<RouterProvider router={router} />, options), router };
}

export { act, render, renderHook, screen, waitFor, within };
