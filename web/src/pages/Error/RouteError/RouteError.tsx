import { CircleAlert } from 'lucide-react';
import { Link } from 'react-router';
import { BASE_ROUTES_PATHS } from '@application/routes/routesUtils';
import { Button } from '@components/ui/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia } from '@components/ui/empty';

function RouteErrorHeader() {
  return (
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <CircleAlert aria-hidden="true" />
      </EmptyMedia>
      <h1 className="font-heading text-lg font-medium tracking-tight">Page not available</h1>
      <EmptyDescription>Something went wrong. Please try again.</EmptyDescription>
    </EmptyHeader>
  );
}

// The one error boundary, on the root route: a failed loader, a thrown read or a failed chunk lands here.
function RouteError() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Empty>
        <RouteErrorHeader />
        <EmptyContent>
          <Button render={<Link to={BASE_ROUTES_PATHS.HOME} />}>Back to home</Button>
        </EmptyContent>
      </Empty>
    </main>
  );
}

export default RouteError;
