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

// Real route objects, so a page's loader and action run as they do in the app. The router comes back too, for a
// test that navigates or reads the current location.
export function renderRoutes(routes: RouteObject[], { initialEntries = ['/'], ...options }: RenderRoutesOptions = {}) {
  const router = createMemoryRouter(withFreshLazy(routes), { initialEntries });

  return { ...render(<RouterProvider router={router} />, options), router };
}

export { act, render, renderHook, screen, waitFor, within };
