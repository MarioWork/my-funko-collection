import { Moon, Sun, SunMoon } from 'lucide-react';
import { ThemeUtil } from '@application/theme/themeUtils';
import SegmentedToggle, { type SegmentedOption } from '@components/SegmentedToggle';
import { useTheme } from '@hooks/useTheme';
import SettingsSection from './SettingsSection';

const THEME_OPTIONS: SegmentedOption<ThemeUtil>[] = [
  { value: ThemeUtil.LIGHT, label: 'Light', icon: Sun },
  { value: ThemeUtil.DARK, label: 'Dark', icon: Moon },
  { value: ThemeUtil.SYSTEM, label: 'System', icon: SunMoon },
];

function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  return (
    <SettingsSection title="Appearance" description="System follows your device and switches with it.">
      <SegmentedToggle label="Theme" options={THEME_OPTIONS} value={theme} onChange={setTheme} />
    </SettingsSection>
  );
}

export default AppearanceSection;
