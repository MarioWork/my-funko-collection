import { useState } from 'react';
import { Outlet, useLoaderData } from 'react-router';
import type { LoaderDataUtil } from '@app-types/utility';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import PageHeader from '@components/PageHeader';
import FunkoActionRow from './components/FunkoActionRow';
import FunkoDeleteDialog from './components/FunkoDeleteDialog';
import FunkoGallery from './components/FunkoGallery';
import FunkoMemberships from './components/FunkoMemberships';
import FunkoSpecs from './components/FunkoSpecs';
import type { loader } from './funkoDetailLoader';

// Two panes from the `lg` container width: photos left, facts and collections right. Stacked on phones.
function FunkoDetail() {
  const { funko, collections, items } = useLoaderData<LoaderDataUtil<typeof loader>>();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={funko.name}
        description={`#${funko.number} · ${funko.category.name}`}
        backTo={FUNKO_ROUTES_PATHS.BASE}
        backLabel="Funkos"
      />
      <div className="grid gap-6 @3xl:grid-cols-[minmax(0,480px)_minmax(0,1fr)]">
        <FunkoGallery funko={funko} />
        <div className="flex flex-col gap-4">
          <FunkoActionRow
            funko={funko}
            collections={collections}
            items={items}
            onDelete={() => setIsDeleteOpen(true)}
          />
          <FunkoSpecs funko={funko} />
          <FunkoMemberships items={items} />
        </div>
      </div>
      <FunkoDeleteDialog funko={funko} items={items} isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} />
      <Outlet />
    </div>
  );
}

export default FunkoDetail;
