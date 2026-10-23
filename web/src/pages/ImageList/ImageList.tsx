import { useState } from 'react';
import type { ImageGroupApiModel, ImageListEntryApiModel } from '@app-types/models';
import type { LoaderDataUtil, ResponseWithPaginationUtil } from '@app-types/utility';
import EmptyState from '@components/EmptyState';
import InfiniteListFooter from '@components/InfiniteListFooter';
import ExportMenu from '@components/ExportMenu';
import PageHeader from '@components/PageHeader';
import exportService from '@services/exportService/exportService';
import { Button } from '@components/ui/button';
import { useInfiniteList } from '@hooks/useInfiniteList';
import { useIsRefreshing } from '@hooks/useIsRefreshing';
import { cn } from '@utils/classNameUtils';
import { DIMMABLE_CLASS, DIMMED_CLASS } from '@utils/motionUtils';
import ImageGroupTable from './components/ImageGroupTable';
import ImageListToolbar from './components/ImageListToolbar';
import ImagePreviewDialog from './components/ImagePreviewDialog';
import ImageTable from './components/ImageTable';
import { useImageListParams } from './hooks/useImageListParams';
import type { loader } from './imageListLoader';
import { ImageViewUtil } from './imageListUtils';

type ImageLoaderData = LoaderDataUtil<typeof loader> | undefined;

const NO_IMAGES: ResponseWithPaginationUtil<ImageListEntryApiModel> = {
  data: [],
  totalResultNumber: 0,
  currentPage: 1,
};
const NO_GROUPS: ResponseWithPaginationUtil<ImageGroupApiModel> = { data: [], totalResultNumber: 0, currentPage: 1 };

const keyOfEntry = (entry: ImageListEntryApiModel | ImageGroupApiModel) => entry.key;
const imagesPageOf = (loaderData: unknown) => (loaderData as ImageLoaderData)?.imagesResponse;
const groupsPageOf = (loaderData: unknown) => (loaderData as ImageLoaderData)?.groupsResponse;

type TotalDescriber = (total: number, isFiltered: boolean) => string;

// "120 images stored" / "40 groups, one per funko".
const TOTAL_DESCRIBER_MAP: Record<ImageViewUtil, TotalDescriber> = {
  [ImageViewUtil.IMAGES]: (total, isFiltered) => `${total} images ${isFiltered ? 'matching' : 'stored'}`,
  [ImageViewUtil.FUNKOS]: (total, isFiltered) => `${total} ${isFiltered ? 'matching ' : ''}groups, one per funko`,
};

// Every stored image as a list of facts (whose it is, dimensions, size, date), searchable and sortable, with the
// files no funko uses findable through the filter. A row opens the picture.
function ImageList() {
  const { data, query, chips, setQuery, clearFilters } = useImageListParams();
  const isRefreshing = useIsRefreshing();
  const [openImage, setOpenImage] = useState<ImageListEntryApiModel | null>(null);
  const { imagesResponse, groupsResponse, total } = data;
  // Both lists exist as hooks; only the view's own one has a page to show.
  const images = useInfiniteList({ firstPage: imagesResponse ?? NO_IMAGES, pageOf: imagesPageOf, keyOf: keyOfEntry });
  const groups = useInfiniteList({ firstPage: groupsResponse ?? NO_GROUPS, pageOf: groupsPageOf, keyOf: keyOfEntry });
  const shown = imagesResponse ? images : groups;
  const isFiltered = query.length > 0 || chips.length > 0;
  const hasImages = total > 0;

  const clearAll = () => {
    setQuery('');
    clearFilters();
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Images"
        description={TOTAL_DESCRIBER_MAP[data.view](total, isFiltered)}
        iconActions={
          <ExportMenu
            label="Export all images"
            variant="outline"
            hrefFor={(format) => exportService.getImagesExportUrl(format)}
          />
        }
      >
        <ImageListToolbar />
      </PageHeader>
      <div
        aria-busy={isRefreshing}
        className={cn(
          'flex flex-col gap-4 rounded-xl border bg-card p-4',
          DIMMABLE_CLASS,
          isRefreshing && DIMMED_CLASS,
        )}
      >
        {imagesResponse && hasImages ? (
          <ImageTable images={images.items} onOpen={setOpenImage} isLoadingMore={images.isLoading} />
        ) : null}
        {groupsResponse && hasImages ? (
          <ImageGroupTable groups={groups.items} onOpen={setOpenImage} isLoadingMore={groups.isLoading} />
        ) : null}
        {hasImages ? null : (
          <EmptyState
            pose={isFiltered ? 'notFound' : 'waiting'}
            title={isFiltered ? 'No images match' : 'No images yet'}
            description={isFiltered ? 'Try another word or clear the filter.' : 'Images you add to funkos show here.'}
          >
            {isFiltered ? (
              <Button variant="outline" onClick={clearAll}>
                Clear search and filter
              </Button>
            ) : null}
          </EmptyState>
        )}
        <InfiniteListFooter
          shownCount={shown.items.length}
          total={shown.total}
          hasMore={shown.hasMore}
          isLoading={shown.isLoading}
          noun={imagesResponse ? 'images' : 'groups'}
          onLoadMore={shown.loadMore}
        />
      </div>
      <ImagePreviewDialog image={openImage} onClose={() => setOpenImage(null)} />
    </div>
  );
}

export default ImageList;
