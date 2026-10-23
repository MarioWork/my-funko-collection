import { Download } from 'lucide-react';
import type { ReactNode } from 'react';
import type { ExportFormatUtil } from '@app-types/utility';
import ExportFormatItems from '@components/ExportFormatItems';
import IconButton from '@components/IconButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';

type Props = {
  // "Export Pop! Marvel", "Export all images": the button's name, its tooltip and the menu's title.
  label: string;
  // The download link for one format.
  hrefFor: (format: ExportFormatUtil) => string;
  // Ghost in a list row, outline in a page header.
  variant?: 'ghost' | 'outline';
  // Set when there is nothing to export yet: the button stays, disabled, and says why.
  disabledReason?: string;
  // Options above the formats (a switch that changes what the links download).
  options?: ReactNode;
};

// An icon button (named in its tooltip) that opens a menu of file formats: spreadsheet, CSV, JSON, each a download.
function ExportMenu({ label, hrefFor, variant = 'ghost', disabledReason, options }: Props) {
  if (disabledReason) {
    return (
      <IconButton variant={variant} aria-label={label} disabled disabledReason={disabledReason}>
        <Download aria-hidden="true" />
      </IconButton>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<IconButton variant={variant} aria-label={label} />}>
        <Download aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{label}</DropdownMenuLabel>
          {options}
        </DropdownMenuGroup>
        {options ? <DropdownMenuSeparator /> : null}
        <DropdownMenuGroup>
          <ExportFormatItems hrefFor={hrefFor} />
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ExportMenu;
