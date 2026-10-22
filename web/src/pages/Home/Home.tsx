import { useLoaderData } from 'react-router';
import type { LoaderDataUtil } from '@app-types/utility';
import PageHeader from '@components/PageHeader';
import { Separator } from '@components/ui/separator';
import CategoryBars from './components/CategoryBars';
import CollectionsOverview from './components/CollectionsOverview';
import QuickActions from './components/QuickActions';
import RecentFunkos from './components/RecentFunkos';
import StatsGrid from './components/StatsGrid';
import type { loader } from './homeLoader';

function Home() {
  const { stats, recentFunkos } = useLoaderData<LoaderDataUtil<typeof loader>>();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Home" description="Your collection at a glance." actions={<QuickActions />} />
      <StatsGrid stats={stats} />
      <Separator />
      <RecentFunkos funkos={recentFunkos} />
      <Separator />
      <div className="grid gap-6 @3xl:grid-cols-2">
        <CollectionsOverview collections={stats.collections} />
        <CategoryBars categories={stats.byCategory} />
      </div>
    </div>
  );
}

export default Home;
