import { Download } from 'lucide-react';
import DownloadLink from '@components/DownloadLink';
import exportService from '@services/exportService/exportService';
import SettingsSection from './SettingsSection';

// Plain downloads from the API, nothing to configure.
function DataSection() {
  return (
    <SettingsSection title="Data" description="A copy of everything, to keep or to open in a spreadsheet.">
      <div className="flex flex-wrap gap-2">
        <DownloadLink href={exportService.getExportJsonUrl()} variant="secondary">
          <Download data-icon="inline-start" aria-hidden="true" />
          Export everything (JSON)
        </DownloadLink>
        <DownloadLink href={exportService.getExportCsvUrl()} variant="secondary">
          <Download data-icon="inline-start" aria-hidden="true" />
          Export items (CSV)
        </DownloadLink>
      </div>
    </SettingsSection>
  );
}

export default DataSection;
