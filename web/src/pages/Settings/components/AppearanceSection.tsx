import ThemeSwitcher from '@components/ThemeSwitcher';
import SettingsSection from './SettingsSection';

function AppearanceSection() {
  return (
    <SettingsSection title="Appearance" description="System follows your device and switches with it.">
      <ThemeSwitcher />
    </SettingsSection>
  );
}

export default AppearanceSection;
