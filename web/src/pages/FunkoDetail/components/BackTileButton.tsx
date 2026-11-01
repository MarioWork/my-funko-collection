import { ArrowLeft } from 'lucide-react';

type Props = {
  onClick: () => void;
};

// The funko page's Back button, as a tile like the sections below it: the same card background, border and radius
// in every state (the vendored ghost and outline buttons swap their background on hover, and in dark mode). Hover
// shows in the text colour instead.
function BackTileButton({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 items-center gap-1.5 self-start rounded-xl border bg-card px-3 text-sm font-medium text-card-foreground transition-colors outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
    >
      <ArrowLeft aria-hidden="true" className="size-4" />
      Back
    </button>
  );
}

export default BackTileButton;
