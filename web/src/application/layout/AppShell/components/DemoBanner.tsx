import { Info } from 'lucide-react';

// Only in the public demo build (VITE_DEMO): the data lives in the visitor's browser tab, so say so up front.
function DemoBanner() {
  if (import.meta.env.VITE_DEMO !== 'true') return null;

  return (
    <p className="flex items-center justify-center gap-2 border-b bg-accent-soft px-4 py-1.5 text-center text-xs text-accent-soft-foreground">
      <Info aria-hidden="true" className="size-3.5 shrink-0" />
      Demo: try anything. Changes stay in this tab and reset when you reload.
    </p>
  );
}

export default DemoBanner;
