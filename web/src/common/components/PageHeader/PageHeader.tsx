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
};

// The one h1 per page, with an optional back link and an actions slot that wraps under the title on phones.
function PageHeader({ title, description, backTo, onBack, backLabel = 'Back', actions }: Props) {
  return (
    <header className="flex flex-col gap-3">
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-balance lg:text-3xl">{title}</h1>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex max-w-full flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

export default PageHeader;
