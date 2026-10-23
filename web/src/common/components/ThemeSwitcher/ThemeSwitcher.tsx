import { THEME_OPTIONS } from '@utils/themeUtils';
import SegmentedToggle from '@components/SegmentedToggle';
import { useTheme } from '@hooks/useTheme';

// Light, dark or follow the device: Settings and the phone menu.
function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return <SegmentedToggle label="Theme" options={THEME_OPTIONS} value={theme} onChange={setTheme} />;
}

export default ThemeSwitcher;
