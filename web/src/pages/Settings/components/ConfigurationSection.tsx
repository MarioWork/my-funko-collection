import { MANAGE_ITEMS } from '@utils/navigationUtils';
import LinkButton from '@components/LinkButton';
import { useIsDesktop } from '@hooks/useIsDesktop';
import SettingsSection from './SettingsSection';

// The manage pages (categories, series, tags). On desktop they sit in the sidebar, so this card only shows on phones.
function ConfigurationSection() {
  const isDesktop = useIsDesktop();

  if (isDesktop) return null;

  return (
    <SettingsSection title="Configuration" description="The lines on the boxes and the labels on your items.">
      <div className="flex flex-wrap gap-2">
        {MANAGE_ITEMS.map(({ label, to, icon: Icon }) => (
          <LinkButton key={to} to={to} variant="outline">
            <Icon data-icon="inline-start" aria-hidden="true" />
            {label}
          </LinkButton>
        ))}
      </div>
    </SettingsSection>
  );
}

export default ConfigurationSection;
