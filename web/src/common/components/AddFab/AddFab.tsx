import { Plus } from 'lucide-react';
import { ADD_ROUTES_PATHS } from '@application/routes/routesUtils';
import LinkButton from '@components/LinkButton';

type Props = {
  // Where + goes: the Add flow by default, or a page's own "new" form.
  to?: string;
  // The button's name, since it shows only the +: "Add funko", "New tag".
  label?: string;
};

// The one floating action below `lg`: a round + above the bottom bar and its safe-area inset. Hidden on desktop,
// where the page header carries the same action as a labelled button.
function AddFab({ to = ADD_ROUTES_PATHS.BASE, label = 'Add funko' }: Props) {
  return (
    <LinkButton
      to={to}
      aria-label={label}
      className="fixed right-4 bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom)+1rem)] z-30 size-14 rounded-full p-0 shadow-lg lg:hidden"
    >
      <Plus className="size-6" aria-hidden="true" />
    </LinkButton>
  );
}

export default AddFab;
