import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@components/ui/empty';

type Props = {
  icon: LucideIcon;
  title: string;
  description?: string;
  // The next action(s): buttons or links. An empty state without one is a dead end.
  children?: ReactNode;
};

function EmptyState({ icon: Icon, title, description, children }: Props) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>
          <h2 className="text-inherit">{title}</h2>
        </EmptyTitle>
        {description ? <EmptyDescription>{description}</EmptyDescription> : null}
      </EmptyHeader>
      {children ? <EmptyContent className="flex-row flex-wrap justify-center gap-2">{children}</EmptyContent> : null}
    </Empty>
  );
}

export default EmptyState;
