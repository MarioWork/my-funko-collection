import { Outlet, useLoaderData } from 'react-router';
import { PAGE_ICONS } from '@utils/navigationUtils';
import type { LoaderDataUtil } from '@app-types/utility';
import PageHeader from '@components/PageHeader';
import { useMobileChildPage } from '@hooks/useMobileChildPage';
import CategoryBars from './components/CategoryBars';
import CollectionsOverview from './components/CollectionsOverview';
import QuickActions from './components/QuickActions';
import RecentFunkos from './components/RecentFunkos';
import StatsGrid from './components/StatsGrid';
import type { loader } from './homeLoader';

function Home() {
  const childPage = useMobileChildPage();
  const { stats, recentFunkos } = useLoaderData<LoaderDataUtil<typeof loader>>();

  // On phones the Add flow opened from here is its own page.
  if (childPage) return childPage;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={PAGE_ICONS.HOME}
        title="Home"
        description="Your collection at a glance."
        actions={<QuickActions />}
      />
      <StatsGrid stats={stats} />
      <RecentFunkos funkos={recentFunkos} />
      <div className="grid gap-6 @3xl:grid-cols-2">
        <CollectionsOverview collections={stats.collections} />
        <CategoryBars categories={stats.byCategory} />
      </div>
      <Outlet />
    </div>
  );
}

export default Home;
