import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { SidebarStartUtil } from '@app-types/utility';
import SegmentedToggle, { type SegmentedOption } from '@components/SegmentedToggle';
import ThemeSwitcher from '@components/ThemeSwitcher';
import { useSidebarStart } from '@hooks/useSidebarStart';
import SettingsSection from './SettingsSection';

const SIDEBAR_START_OPTIONS: SegmentedOption<SidebarStartUtil>[] = [
  { value: SidebarStartUtil.EXPANDED, label: 'Expanded', icon: PanelLeftOpen },
  { value: SidebarStartUtil.COLLAPSED, label: 'Collapsed', icon: PanelLeftClose },
];

// The theme, and how the sidebar opens on a computer (phones have no sidebar). Both stay on this device.
function AppearanceSection() {
  const [sidebarStart, setSidebarStart] = useSidebarStart();

  return (
    <SettingsSection title="Appearance" description="System follows your device and switches with it.">
      <ThemeSwitcher />
      <div className="flex flex-col gap-2">
        {/* Visible title; the toggle group carries the same name for assistive tech. */}
        <p className="text-sm font-medium">Sidebar starts</p>
        <SegmentedToggle
          label="Sidebar starts"
          options={SIDEBAR_START_OPTIONS}
          value={sidebarStart}
          onChange={setSidebarStart}
        />
        <p className="text-sm text-muted-foreground">On a computer, each time the app opens.</p>
      </div>
    </SettingsSection>
  );
}

export default AppearanceSection;
