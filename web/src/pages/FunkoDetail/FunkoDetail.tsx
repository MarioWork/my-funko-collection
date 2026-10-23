import { useState } from 'react';
import { Outlet, useLoaderData } from 'react-router';
import type { LoaderDataUtil } from '@app-types/utility';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import { ArrowLeft } from 'lucide-react';
import LinkButton from '@components/LinkButton';
import { useMobileChildPage } from '@hooks/useMobileChildPage';
import FunkoActionsMenu from './components/FunkoActionsMenu';
import FunkoCollectionToggles from './components/FunkoCollectionToggles';
import FunkoDeleteDialog from './components/FunkoDeleteDialog';
import FunkoGallery from './components/FunkoGallery';
import FunkoMemberships from './components/FunkoMemberships';
import FunkoSummary from './components/FunkoSummary';
import type { loader } from './funkoDetailLoader';

// Just a back link on top; the name, its actions and the facts live in the summary tile. Two panes from the `lg`
// container width: photos left, summary and collections right. Stacked on phones.
function FunkoDetail() {
  const childPage = useMobileChildPage();
  const { funko, collections, items } = useLoaderData<LoaderDataUtil<typeof loader>>();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // On phones Edit is its own page.
  if (childPage) return childPage;

  return (
    <div className="flex flex-col gap-4">
      <LinkButton to={FUNKO_ROUTES_PATHS.BASE} variant="ghost" size="sm" className="self-start">
        <ArrowLeft data-icon="inline-start" aria-hidden="true" />
        Funkos
      </LinkButton>
      <div className="grid gap-6 @3xl:grid-cols-[minmax(0,480px)_minmax(0,1fr)]">
        <FunkoGallery funko={funko} />
        <div className="flex flex-col gap-4">
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
