import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import LinkButton from '@components/LinkButton';
import { Button } from '@components/ui/button';

type Props = {
  title: string;
  description?: string;
  // A fixed destination (the list a detail belongs to)…
  backTo?: string;
  // …or "wherever you came from" (a flow reachable from several pages).
  onBack?: () => void;
  backLabel?: string;
  actions?: ReactNode;
  // Icon buttons (Export) that stay at the end of the title's row on phones, where `actions` wrap under the title;
  // on desktop they sit after `actions`.
  iconActions?: ReactNode;
  // Shown under the title inside the same card, e.g. a list's search and filters.
  children?: ReactNode;
};

// The one h1 per page, on a card like the page's own content, with an optional back link, an actions slot that
// wraps under the title on phones, and icon actions that stay on the title's row.
function PageHeader({ title, description, backTo, onBack, backLabel = 'Back', actions, iconActions, children }: Props) {
  return (
    <header className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      {backTo ? (
        <LinkButton to={backTo} variant="ghost" size="sm" className="self-start">
          <ArrowLeft data-icon="inline-start" aria-hidden="true" />
          {backLabel}
        </LinkButton>
      ) : null}
      {onBack && !backTo ? (
        <Button variant="ghost" size="sm" className="self-start" onClick={onBack}>
          <ArrowLeft data-icon="inline-start" aria-hidden="true" />
          {backLabel}
        </Button>
      ) : null}
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex min-w-0 flex-1 basis-0 flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-balance lg:text-3xl">{title}</h1>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? (
          <div className="order-3 flex max-w-full basis-full flex-wrap items-center gap-2 lg:order-2 lg:basis-auto">
            {actions}
          </div>
        ) : null}
        {iconActions ? <div className="order-2 flex items-center gap-2 lg:order-3">{iconActions}</div> : null}
      </div>
      {children}
    </header>
  );
}

export default PageHeader;
