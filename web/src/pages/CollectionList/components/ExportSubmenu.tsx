import { Download } from 'lucide-react';
import type { CollectionApiModel } from '@app-types/models';
import { ExportFunkosScopeUtil } from '@app-types/utility';
import DisabledReason from '@components/DisabledReason';
import ExportFormatItems from '@components/ExportFormatItems';
import { DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '@components/ui/dropdown-menu';
import exportService from '@services/exportService/exportService';
import { reasonWhen } from '@utils/disabledReasonUtils';

type Props = {
  collection: CollectionApiModel;
};

const EMPTY_EXPORT_REASON = 'Nothing to export: this collection has no items yet.';

// Export → spreadsheet, CSV or JSON of the collection's funkos. Disabled, with the reason, while it is empty.
function ExportSubmenu({ collection }: Props) {
  const isEmpty = collection.itemCount === 0;

  return (
    <DisabledReason reason={reasonWhen(isEmpty, EMPTY_EXPORT_REASON)} mode="wrapper" wrapperClassName="block">
      <DropdownMenuSub>
        <DropdownMenuSubTrigger disabled={isEmpty}>
          <Download aria-hidden="true" />
          Export
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="w-64">
          <ExportFormatItems
            hrefFor={(format) =>
              exportService.getFunkosExportUrl(format, ExportFunkosScopeUtil.COLLECTION, collection.id)
            }
          />
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    </DisabledReason>
  );
}

export default ExportSubmenu;
