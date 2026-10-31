import { ExternalLink, Plus, ScanBarcode } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { SubmissionStatusUtil } from '@app-types/utility';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import FunkoImage from '@components/FunkoImage';
import LinkButton from '@components/LinkButton';
import { Button } from '@components/ui/button';
import type { AddResult } from '../addUtils';

type Props = {
  result: AddResult;
  onAddAnother: () => void;
  onScanAnother: () => void;
};

const THUMB_SIZES = '96px';
const WAITING_NOTE = 'Sent in for review: only you see it until an admin approves it.';

function membershipText({ funko }: AddResult): string {
  if (funko.collections.length === 0) return 'Saved to the catalog only.';

  return `Saved to ${funko.collections.map((collection) => collection.name).join(', ')}.`;
}

// After a save: what happened, then straight on to the next one.
function SavedCard({ result, onAddAnother, onScanAnother }: Props) {
  const { funko } = result;
  const isWaiting = funko.status === SubmissionStatusUtil.WAITING;
  const heading = useRef<HTMLHeadingElement>(null);

  // The form that had focus is gone; put the screen reader and keyboard on the result instead.
  useEffect(() => heading.current?.focus(), []);

  return (
    <section aria-label="Saved" className="flex max-w-xl flex-col gap-4 rounded-xl border bg-card p-4">
      <div className="flex gap-3">
        <FunkoImage
          image={funko.primaryImage}
          alt={funko.name}
          sizes={THUMB_SIZES}
          className="aspect-3/4 w-20 rounded-lg"
        />
        <div className="flex min-w-0 flex-col gap-1">
          <h2 ref={heading} tabIndex={-1} className="text-base font-semibold outline-none">
            {funko.name}
          </h2>
          <p className="text-sm text-muted-foreground">
            #{funko.number} · {membershipText(result)}
          </p>
          {isWaiting ? <p className="text-sm text-muted-foreground">{WAITING_NOTE}</p> : null}
        </div>
      </div>
      <div className="grid gap-2 @md:grid-cols-3">
        <Button onClick={onAddAnother}>
          <Plus data-icon="inline-start" aria-hidden="true" />
          Add another
        </Button>
        <Button variant="outline" onClick={onScanAnother}>
          <ScanBarcode data-icon="inline-start" aria-hidden="true" />
          Scan another
        </Button>
        <LinkButton to={FUNKO_ROUTES_PATHS.detail(String(funko.id))} variant="ghost">
          <ExternalLink data-icon="inline-start" aria-hidden="true" />
          Open {funko.name}
        </LinkButton>
      </div>
    </section>
  );
}

export default SavedCard;
