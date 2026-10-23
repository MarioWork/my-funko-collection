import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type Props = {
  id: string;
  icon: LucideIcon;
  title: string;
  description?: string;
  children: ReactNode;
};

// One numbered part of the Add page: a card with its own heading, so the page reads as Images → Details →
// Collections and a screen reader can jump between them.
function FormSection({ id, icon: Icon, title, description, children }: Props) {
  const headingId = `${id}-heading`;

  return (
    <section
      aria-labelledby={headingId}
      // Named for the View Transitions of the Add page, so a section that grows or shrinks glides (index.css).
      style={{ viewTransitionName: id }}
      className="flex flex-col gap-4 rounded-xl border bg-card p-4 [view-transition-class:add-form] sm:p-5"
    >
      <div className="flex flex-col gap-1">
        <h2 id={headingId} className="flex items-center gap-2 font-heading text-base font-semibold">
          <Icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          {title}
        </h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export default FormSection;
