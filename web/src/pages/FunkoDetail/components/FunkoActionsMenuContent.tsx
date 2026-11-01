import { Download, ListChecks } from 'lucide-react';
import type { CollectionApiModel, CollectionItemApiModel, FunkoDetailApiModel } from '@app-types/models';
import { ExportFunkosScopeUtil } from '@app-types/utility';
import DisabledReason from '@components/DisabledReason';
import ExportFormatItems from '@components/ExportFormatItems';
import {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@components/ui/dropdown-menu';
import { useReadOnlyReason } from '@hooks/useReadOnlyReason';
import exportService from '@services/exportService/exportService';
import { DISABLED_REASONS, firstReason, reasonWhen } from '@utils/disabledReasonUtils';
import { useCanEditFunko } from '../hooks/useCanEditFunko';
import { useFunkoMemberships } from '../hooks/useFunkoMemberships';
import FunkoDeleteMenuGroup from './FunkoDeleteMenuGroup';
import FunkoEditMenuItem from './FunkoEditMenuItem';

type Props = {
  funko: FunkoDetailApiModel;
  collections: CollectionApiModel[];
  items: CollectionItemApiModel[];
  onDelete: () => void;
};

type ReadOnlyProps = {
  // Set for a read-only user: the item shows disabled, saying why.
  readOnlyReason: string | undefined;
};

type ListsSubmenuProps = Pick<Props, 'funko' | 'collections' | 'items'> & ReadOnlyProps;

// Every collection as a checkbox: ticked while the funko is in it, a tap adds or removes it.
function ListsSubmenu({ funko, collections, items, readOnlyReason }: ListsSubmenuProps) {
  const { memberIds, isBusy, toggle } = useFunkoMemberships({ funko, items });
  const reason = firstReason(readOnlyReason, reasonWhen(isBusy, DISABLED_REASONS.WORKING));

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <ListChecks aria-hidden="true" />
        Lists
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {collections.map((collection) => (
          <DisabledReason key={collection.id} reason={reason} mode="wrapper" wrapperClassName="block">
            <DropdownMenuCheckboxItem
              checked={memberIds.has(collection.id)}
              disabled={reason !== undefined}
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

// The open ⋯ menu: Edit, Lists (every collection), Export, then Delete on its own. Edit and Delete change the shared
// catalogue, so only an admin gets them, and a member on their own waiting submission; anyone keeps Lists and Export.
// A read-only user sees Edit, Lists and Delete disabled, saying why; Export stays.
function FunkoActionsMenuContent({ funko, collections, items, onDelete }: Props) {
  const canEdit = useCanEditFunko(funko);
  const readOnlyReason = useReadOnlyReason();

  return (
    <DropdownMenuContent align="end">
      <DropdownMenuGroup>
        {canEdit ? <FunkoEditMenuItem funkoId={funko.id} readOnlyReason={readOnlyReason} /> : null}
        <ListsSubmenu funko={funko} collections={collections} items={items} readOnlyReason={readOnlyReason} />
        <ExportSubmenu funko={funko} />
      </DropdownMenuGroup>
      {canEdit ? <FunkoDeleteMenuGroup readOnlyReason={readOnlyReason} onDelete={onDelete} /> : null}
    </DropdownMenuContent>
  );
}

export default FunkoActionsMenuContent;
