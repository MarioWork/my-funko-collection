// The app's motion, in one place: short (150–250 ms), on the two easing curves from index.css, and off when the
// system asks for reduced motion (every class is motion-safe:). Enter animations only: things that leave just go.

// Something that appears: fades in.
export const FADE_IN_CLASS =
  'motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200 motion-safe:ease-decelerate';

// The next step of a flow, a new page: fades in and rises a little.
export const ENTER_UP_CLASS = `${FADE_IN_CLASS} motion-safe:slide-in-from-bottom-2`;

// A phone page opened on top of another (an edit or add form): slides in from the right, as a pushed screen does.
export const ENTER_FROM_RIGHT_CLASS = `${FADE_IN_CLASS} motion-safe:slide-in-from-right-6`;

// Content that is being replaced (a list while its loader runs, a row while it is removed): dims, then comes back.
export const DIMMABLE_CLASS = 'transition-opacity duration-200 ease-standard';
export const DIMMED_CLASS = 'opacity-50';
