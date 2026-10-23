import { flushSync } from 'react-dom';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const DROPPED_TRANSITION_MESSAGE = /^Transition was (skipped|aborted)/;

function isDroppedTransition(reason: unknown): boolean {
  return reason instanceof DOMException && DROPPED_TRANSITION_MESSAGE.test(reason.message);
}

// The browser drops a view transition when another one starts or the window is resized mid-way (a phone's toolbar
// or keyboard), and rejects promises that React and the router never catch. It is harmless: the change still
// applies, only without the animation. Called once at start-up, so those do not show as errors.
export function ignoreDroppedViewTransitions(): void {
  window.addEventListener('unhandledrejection', (event) => {
    if (isDroppedTransition(event.reason)) event.preventDefault();
  });
}

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
