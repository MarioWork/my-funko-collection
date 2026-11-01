import { Wrench } from 'lucide-react';

const TITLE_ID = 'dev-mode-title';
const isUsingMocks = import.meta.env.VITE_USE_MOCKS === 'true';
const DATA_SOURCE = isUsingMocks ? 'mock data in this browser' : 'the real local API';

// Only in `yarn dev` (Login renders it under import.meta.env.DEV, so a build has none of it): which data the sign-in
// below goes to. Said in words, not by colour.
function DevModeBanner() {
  return (
    <div
      role="note"
      aria-labelledby={TITLE_ID}
      className="flex items-start gap-2 rounded-lg border border-dashed border-primary px-3 py-2 text-sm text-foreground"
    >
      <Wrench className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
      <p>
        <strong id={TITLE_ID}>Development mode</strong>: signing in uses {DATA_SOURCE}.
      </p>
    </div>
  );
}

export default DevModeBanner;
