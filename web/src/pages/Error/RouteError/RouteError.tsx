import { House, RotateCw, Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router';
import { BASE_ROUTES_PATHS } from '@application/routes/routesUtils';
import AppLogo from '@components/AppLogo';
import FunkoFigureArt from '@components/FunkoFigureArt';
import LinkButton from '@components/LinkButton';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';

type ErrorKind = 'notFound' | 'broken';

type ErrorCopy = {
  // The storage-box label on the figure, as a tag reads "Box 3".
  label: string;
  title: string;
  description: string;
};

type ErrorFigureProps = {
  label: string;
};

type ErrorCardProps = {
  copy: ErrorCopy;
  children: ReactNode;
};

const NOT_FOUND_STATUS = 404;

const ERROR_COPY: Record<ErrorKind, ErrorCopy> = {
  notFound: {
    label: 'Box 404',
    title: 'This shelf is empty',
    description: 'We looked in every box, but this page is not here. The link may be old or mistyped.',
  },
  broken: {
    label: 'Oops',
    title: 'Something went wrong',
    description: 'This page tripped over on the way in. Try again, or head back home.',
  },
};

function errorKindOf(error: unknown): ErrorKind {
  const isNotFound = isRouteErrorResponse(error) && error.status === NOT_FOUND_STATUS;

  return isNotFound ? 'notFound' : 'broken';
}

function NotFoundActions() {
  return (
    <>
      <LinkButton to={BASE_ROUTES_PATHS.HOME}>
        <House data-icon="inline-start" aria-hidden="true" />
        Back to home
      </LinkButton>
      <LinkButton to={BASE_ROUTES_PATHS.SEARCH} variant="outline">
        <Search data-icon="inline-start" aria-hidden="true" />
        Search
      </LinkButton>
    </>
  );
}

function BrokenActions() {
  return (
    <>
      <Button onClick={() => window.location.reload()}>
        <RotateCw data-icon="inline-start" aria-hidden="true" />
        Try again
      </Button>
      <LinkButton to={BASE_ROUTES_PATHS.HOME} variant="outline">
        <House data-icon="inline-start" aria-hidden="true" />
        Back to home
      </LinkButton>
    </>
  );
}

const ACTIONS_MAP: Record<ErrorKind, () => ReactNode> = {
  notFound: NotFoundActions,
  broken: BrokenActions,
};

// The app's funko drawing, puzzled, with a box label hanging off it at a tilt.
function ErrorFigure({ label }: ErrorFigureProps) {
  return (
    <div className="relative">
      <FunkoFigureArt pose="notFound" className="w-36 text-muted-foreground" />
      <Badge variant="outline" className="absolute -bottom-1 -left-3 -rotate-6 bg-card shadow-sm">
        {label}
      </Badge>
    </div>
  );
}

function ErrorCard({ copy, children }: ErrorCardProps) {
  return (
    <section className="flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border bg-card p-8 text-center shadow-sm">
      <ErrorFigure label={copy.label} />
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-bold tracking-tight">{copy.title}</h1>
        <p className="text-sm text-balance text-muted-foreground">{copy.description}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">{children}</div>
    </section>
  );
}

// The one error boundary, on the root route: an unknown address, a failed loader, a thrown read or a failed chunk
// lands here, outside the app shell. A 404 gets the empty-shelf page; anything else offers a reload. The error
// itself is never shown: it can carry request details.
function RouteError() {
  const kind = errorKindOf(useRouteError());
  const Actions = ACTIONS_MAP[kind];

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="p-4">
        <Link
          to={BASE_ROUTES_PATHS.HOME}
          aria-label="My Funko Collection, home"
          className="inline-flex rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <AppLogo />
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center p-4 pb-16">
        <ErrorCard copy={ERROR_COPY[kind]}>
          <Actions />
        </ErrorCard>
      </main>
    </div>
  );
}

export default RouteError;
