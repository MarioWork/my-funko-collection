import { flushSync } from 'react-dom';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

// Runs a state change as a View Transition, so elements with a `view-transition-name` glide from their old place
// to the new one instead of jumping. Without browser support, or with reduced motion, it just applies the change.
// Resolves once the page shows the change, so the caller can move focus to where things ended up.
export async function withViewTransition(update: () => void): Promise<void> {
  const isSupported = typeof document.startViewTransition === 'function';
  const isReducedMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches;

  if (!isSupported || isReducedMotion) {
    flushSync(update);

    return;
  }

  const transition = document.startViewTransition(() => flushSync(update));

  await transition.updateCallbackDone;
}
