import { Braces, FileSpreadsheet, FileText, type LucideIcon } from 'lucide-react';
import { ExportFormatUtil } from '@app-types/utility';
import { DropdownMenuItem } from '@components/ui/dropdown-menu';

type Props = {
  // The download link for one format: the funkos of a category, a whole list, ...
  hrefFor: (format: ExportFormatUtil) => string;
};

type FormatOption = {
  format: ExportFormatUtil;
  label: string;
  // One line under the label: what the file is good for.
  description: string;
  icon: LucideIcon;
};

const FORMAT_OPTIONS: FormatOption[] = [
  {
    format: ExportFormatUtil.SPREADSHEET,
    label: 'Spreadsheet',
    description: 'Excel, Numbers or Google Sheets',
    icon: FileSpreadsheet,
  },
  { format: ExportFormatUtil.CSV, label: 'CSV', description: 'Plain text, opens anywhere', icon: FileText },
  { format: ExportFormatUtil.JSON, label: 'JSON', description: 'For other apps and scripts', icon: Braces },
];

// One download link per file format. Links, not actions: the browser fetches the file with the session cookie.
function ExportFormatItems({ hrefFor }: Props) {
  return FORMAT_OPTIONS.map((option) => {
    const Icon = option.icon;

    return (
      <DropdownMenuItem
        key={option.format}
        className="items-start gap-2.5 py-2"
        // eslint-disable-next-line jsx-a11y-x/anchor-has-content -- Base UI renders the item's icon and text inside this anchor
        render={<a href={hrefFor(option.format)} download />}
      >
        <Icon aria-hidden="true" className="mt-0.5 text-muted-foreground" />
        <span className="flex flex-col">
          <span className="font-medium">{option.label}</span>
          <span className="text-xs text-muted-foreground">{option.description}</span>
        </span>
      </DropdownMenuItem>
    );
  });
}

export default ExportFormatItems;
