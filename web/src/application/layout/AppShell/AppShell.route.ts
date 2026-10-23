import type { ShouldRevalidateFunction } from 'react-router';

export { default as Component } from './AppShell';
export { loader } from './appShellLoader';

// The signed-in user does not change while the shell is up, so its status check never re-runs after a write or a
// navigation: one request per visit, not one per page. Signing out leaves the shell, and coming back mounts it again.
export const shouldRevalidate: ShouldRevalidateFunction = () => false;
