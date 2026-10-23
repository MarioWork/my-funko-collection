import { useState } from 'react';
import type { ExportListKindUtil } from '@app-types/utility';
import ExportMenu from '@components/ExportMenu';
import MenuSwitchItem from '@components/MenuSwitchItem';
import exportService from '@services/exportService/exportService';

type Props = {
  kind: ExportListKindUtil;
  // "categories", "tags": names the button ("Export all categories").
  noun: string;
  // Set when the list is empty: the button stays, disabled, and says why.
  disabledReason?: string;
};

// The page header's Export for a whole list, with a switch to bring every entry's funkos along (a second sheet, the
// CSV's lines, or nested in the JSON).
function ListExportMenu({ kind, noun, disabledReason }: Props) {
  const [isIncludingFunkos, setIsIncludingFunkos] = useState(false);

  return (
    <ExportMenu
      label={`Export all ${noun}`}
      variant="outline"
      disabledReason={disabledReason}
      hrefFor={(format) => exportService.getListExportUrl(format, kind, isIncludingFunkos)}
      options={<MenuSwitchItem label="Include their funkos" isOn={isIncludingFunkos} onChange={setIsIncludingFunkos} />}
    />
  );
}

export default ListExportMenu;
