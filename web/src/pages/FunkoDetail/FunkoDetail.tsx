import { useState } from 'react';
import { Outlet, useLoaderData } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import type { LoaderDataUtil } from '@app-types/utility';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import { Button } from '@components/ui/button';
import { useGoBack } from '@hooks/useGoBack';
import { useMobileChildPage } from '@hooks/useMobileChildPage';
import FunkoActionsMenu from './components/FunkoActionsMenu';
import FunkoCollectionToggles from './components/FunkoCollectionToggles';
import FunkoDeleteDialog from './components/FunkoDeleteDialog';
import FunkoGallery from './components/FunkoGallery';
import FunkoMemberships from './components/FunkoMemberships';
import FunkoSummary from './components/FunkoSummary';
import type { loader } from './funkoDetailLoader';

// Just a Back button (a tile, like the sections) on top; the name, its actions and the facts live in the summary tile. Two panes from the `lg`
// container width: photos left, summary and collections right. Stacked on phones.
function FunkoDetail() {
  const childPage = useMobileChildPage();
  const { funko, collections, items } = useLoaderData<LoaderDataUtil<typeof loader>>();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  // Back to wherever the funko was opened from (a collection, Search, Home); the Funkos list for a shared link.
  const goBack = useGoBack(FUNKO_ROUTES_PATHS.BASE);

  // On phones Edit is its own page.
  if (childPage) return childPage;

  return (
    <div className="flex flex-col gap-4">
      {/* Card background, border and radius like the sections below, so it reads as a tile; the outline button's own
          hover. */}
      <Button variant="outline" size="lg" className="self-start rounded-xl bg-card" onClick={goBack}>
        <ArrowLeft data-icon="inline-start" aria-hidden="true" />
        Back
      </Button>
      <div className="grid items-start gap-6 @3xl:grid-cols-[minmax(0,480px)_minmax(0,1fr)]">
        <FunkoGallery funko={funko} />
        {/* Beside the gallery, this column ends at the screen's bottom (less the top bar, back link and padding), so
            a long Collections list scrolls in its tile rather than the page. */}
        <div className="flex flex-col gap-4 @3xl:max-h-[calc(100dvh-9rem)]">
          <FunkoSummary
            funko={funko}
            actions={
              <>
                <FunkoCollectionToggles funko={funko} collections={collections} items={items} />
                <FunkoActionsMenu
                  funko={funko}
                  collections={collections}
                  items={items}
                  onDelete={() => setIsDeleteOpen(true)}
                />
              </>
            }
          />
          <FunkoMemberships items={items} />
        </div>
      </div>
      <FunkoDeleteDialog funko={funko} items={items} isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} />
      <Outlet />
    </div>
  );
}

export default FunkoDetail;
