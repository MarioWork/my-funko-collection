import type { LoaderFunction } from 'react-router';

export type LoaderDataUtil<TLoaderFn extends LoaderFunction> =
  Awaited<ReturnType<TLoaderFn>> extends Response | infer D ? D : never;
