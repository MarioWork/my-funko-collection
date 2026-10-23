import AppLogo from '@components/AppLogo';
import { Spinner } from '@components/ui/spinner';
import { cn } from '@utils/classNameUtils';
import { FADE_IN_CLASS } from '@utils/motionUtils';

// The first load, while the first page's code and data arrive: the logo and a spinner in the middle of the screen.
// It fades in after a beat, so a fast load goes straight to the page without flashing it. The spinner is the
// "Loading" status for screen readers.
function AppLoading() {
  return (
    <div
      className={cn(
        'flex min-h-svh flex-col items-center justify-center gap-4 bg-background',
        FADE_IN_CLASS,
        'motion-safe:delay-150 motion-safe:fill-mode-both',
      )}
    >
      <AppLogo />
      <Spinner className="size-5 text-muted-foreground" />
    </div>
  );
}

export default AppLoading;
