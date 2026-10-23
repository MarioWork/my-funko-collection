import { useLoaderData } from 'react-router';
import { PAGE_ICONS } from '@application/layout/navigationUtils';
import type { LoaderDataUtil } from '@app-types/utility';
import PageHeader from '@components/PageHeader';
import AboutSection from './components/AboutSection';
import AddDefaultsSection from './components/AddDefaultsSection';
import AppearanceSection from './components/AppearanceSection';
import ConfigurationSection from './components/ConfigurationSection';
import DataSection from './components/DataSection';
import DefaultCollectionSection from './components/DefaultCollectionSection';
import SecuritySection from './components/SecuritySection';
import type { loader } from './settingsLoader';

function Settings() {
  const { collections, tags, passkeys } = useLoaderData<LoaderDataUtil<typeof loader>>();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader icon={PAGE_ICONS.SETTINGS} title="Settings" />
      <div className="grid gap-4 @3xl:grid-cols-2">
        <AppearanceSection />
        <DefaultCollectionSection collections={collections} />
        <AddDefaultsSection collections={collections} tags={tags} />
        <SecuritySection passkeys={passkeys} />
        <ConfigurationSection />
        <DataSection />
        <AboutSection />
      </div>
    </div>
  );
}

export default Settings;
