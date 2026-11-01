import { Pencil } from 'lucide-react';
import { Link } from 'react-router';
import type { FunkoId } from '@app-types/models';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import DisabledReason from '@components/DisabledReason';
import { DropdownMenuItem } from '@components/ui/dropdown-menu';

type Props = {
  funkoId: FunkoId;
  // Set for a read-only user: the item shows disabled, saying why, instead of opening Edit.
  readOnlyReason: string | undefined;
};

// The ⋯ menu's Edit: opens the funko's edit form.
function FunkoEditMenuItem({ funkoId, readOnlyReason }: Props) {
  if (readOnlyReason) {
    return (
      <DisabledReason reason={readOnlyReason} mode="wrapper" wrapperClassName="block">
        <DropdownMenuItem disabled>
          <Pencil aria-hidden="true" />
          Edit
        </DropdownMenuItem>
      </DisabledReason>
    );
  }

  return (
    <DropdownMenuItem render={<Link viewTransition to={FUNKO_ROUTES_PATHS.edit(String(funkoId))} />}>
      <Pencil aria-hidden="true" />
      Edit
    </DropdownMenuItem>
  );
}

export default FunkoEditMenuItem;
