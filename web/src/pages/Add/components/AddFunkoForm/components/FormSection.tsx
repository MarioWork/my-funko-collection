import type { ReactNode } from 'react';

type Props = {
  id: string;
  title: string;
  description?: string;
  // Beside the title, on the right: a count or a small control.
  aside?: ReactNode;
  children: ReactNode;
};

// One numbered part of the Add page: a card with its own heading, so the page reads as Images → Details →
// Collections and a screen reader can jump between them.
function FormSection({ id, title, description, aside, children }: Props) {
  const headingId = `${id}-heading`;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id={headingId} className="font-heading text-base font-semibold">
            {title}
          </h2>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

export default FormSection;
