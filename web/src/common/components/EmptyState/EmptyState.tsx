import type { ReactNode } from 'react';
import FunkoFigureArt, { type FunkoFigurePose } from '@components/FunkoFigureArt';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@components/ui/empty';

type Props = {
  // The app's funko drawing: "waiting" when there is nothing yet, "searching" before a search, "notFound" after
  // one that came back empty.
  pose: FunkoFigurePose;
  title: string;
  // A ReactNode so a hint can go on its own line.
  description?: ReactNode;
  // The next action(s): buttons or links. An empty state without one is a dead end.
  children?: ReactNode;
};

function EmptyState({ pose, title, description, children }: Props) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia>
          <FunkoFigureArt pose={pose} className="w-28 text-muted-foreground" />
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
