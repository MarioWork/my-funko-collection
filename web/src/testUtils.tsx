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
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router';

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

// Real route objects, so a page's loader and action run as they do in the app.
export function renderRoutes(routes: RouteObject[], { initialEntries = ['/'], ...options }: RenderRoutesOptions = {}) {
  const router = createMemoryRouter(routes, { initialEntries });

  return render(<RouterProvider router={router} />, options);
}

export { act, render, renderHook, screen, waitFor, within };
