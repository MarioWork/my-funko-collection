import { Download, ListChecks, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router';
import type { CollectionApiModel, CollectionItemApiModel, FunkoDetailApiModel } from '@app-types/models';
import { ExportFunkosScopeUtil } from '@app-types/utility';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import DisabledReason from '@components/DisabledReason';
import ExportFormatItems from '@components/ExportFormatItems';
import {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@components/ui/dropdown-menu';
import exportService from '@services/exportService/exportService';
import { DISABLED_REASONS, reasonWhen } from '@utils/disabledReasonUtils';
import { useIsAdmin } from '@hooks/useIsAdmin';
import { useFunkoMemberships } from '../hooks/useFunkoMemberships';

type Props = {
  funko: FunkoDetailApiModel;
  collections: CollectionApiModel[];
  items: CollectionItemApiModel[];
  onDelete: () => void;
};

type ListsSubmenuProps = Pick<Props, 'funko' | 'collections' | 'items'>;

// Every collection as a checkbox: ticked while the funko is in it, a tap adds or removes it.
function ListsSubmenu({ funko, collections, items }: ListsSubmenuProps) {
  const { memberIds, isBusy, toggle } = useFunkoMemberships({ funko, items });

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <ListChecks aria-hidden="true" />
        Lists
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {collections.map((collection) => (
          <DisabledReason
            key={collection.id}
            reason={reasonWhen(isBusy, DISABLED_REASONS.WORKING)}
            mode="wrapper"
            wrapperClassName="block"
          >
            <DropdownMenuCheckboxItem
              checked={memberIds.has(collection.id)}
              disabled={isBusy}
              onCheckedChange={() => toggle(collection)}
            >
              {collection.name}
            </DropdownMenuCheckboxItem>
          </DisabledReason>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

type ExportSubmenuProps = Pick<Props, 'funko'>;

// Export → this funko as a spreadsheet (its photos embedded), CSV or JSON (links to its photos).
function ExportSubmenu({ funko }: ExportSubmenuProps) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Download aria-hidden="true" />
        Export
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-64">
        <ExportFormatItems
          hrefFor={(format) => exportService.getFunkosExportUrl(format, ExportFunkosScopeUtil.FUNKO, funko.id)}
        />
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

type DeleteGroupProps = Pick<Props, 'onDelete'>;

function DeleteGroup({ onDelete }: DeleteGroupProps) {
  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <Trash2 aria-hidden="true" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </>
  );
}

// The open ⋯ menu: Edit, Lists (every collection), Export, then Delete on its own. Edit and Delete change the shared
// catalogue, so only an admin gets them; a member keeps Lists and Export.
function FunkoActionsMenuContent({ funko, collections, items, onDelete }: Props) {
  const isAdmin = useIsAdmin();

  return (
    <DropdownMenuContent align="end">
      <DropdownMenuGroup>
        {isAdmin ? (
          <DropdownMenuItem render={<Link viewTransition to={FUNKO_ROUTES_PATHS.edit(String(funko.id))} />}>
            <Pencil aria-hidden="true" />
            Edit
          </DropdownMenuItem>
        ) : null}
        <ListsSubmenu funko={funko} collections={collections} items={items} />
        <ExportSubmenu funko={funko} />
      </DropdownMenuGroup>
      {isAdmin ? <DeleteGroup onDelete={onDelete} /> : null}
    </DropdownMenuContent>
  );
}

export default FunkoActionsMenuContent;
