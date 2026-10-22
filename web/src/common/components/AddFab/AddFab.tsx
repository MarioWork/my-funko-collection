import { Plus } from 'lucide-react';
import { ADD_ROUTES_PATHS } from '@application/routes/routesUtils';
import LinkButton from '@components/LinkButton';

// The one floating action below `lg`: sits above the bottom bar and its safe-area inset. Hidden on desktop,
// where the sidebar carries the Add button.
function AddFab() {
  return (
    <LinkButton
      to={ADD_ROUTES_PATHS.BASE}
      size="lg"
      className="fixed right-4 bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom)+1rem)] z-30 h-14 rounded-full px-5 shadow-lg lg:hidden"
    >
      <Plus data-icon="inline-start" aria-hidden="true" />
      Add
    </LinkButton>
  );
}

export default AddFab;
