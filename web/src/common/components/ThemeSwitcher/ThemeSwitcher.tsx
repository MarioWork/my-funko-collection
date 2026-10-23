import { Moon, Sun, SunMoon } from 'lucide-react';
import { ThemeUtil } from '@application/theme/themeUtils';
import SegmentedToggle, { type SegmentedOption } from '@components/SegmentedToggle';
import { useTheme } from '@hooks/useTheme';

const THEME_OPTIONS: SegmentedOption<ThemeUtil>[] = [
  { value: ThemeUtil.LIGHT, label: 'Light', icon: Sun },
  { value: ThemeUtil.DARK, label: 'Dark', icon: Moon },
  { value: ThemeUtil.SYSTEM, label: 'System', icon: SunMoon },
];

// Light, dark or follow the device: Settings and the phone menu.
function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return <SegmentedToggle label="Theme" options={THEME_OPTIONS} value={theme} onChange={setTheme} />;
}

export default ThemeSwitcher;
