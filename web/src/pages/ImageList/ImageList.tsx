import { useState } from 'react';
import type { ImageListEntryApiModel } from '@app-types/models';
import EmptyState from '@components/EmptyState';
import ListPagination from '@components/ListPagination';
import PageHeader from '@components/PageHeader';
import { Button } from '@components/ui/button';
import { useIsRefreshing } from '@hooks/useIsRefreshing';
import { cn } from '@utils/classNameUtils';
import { DIMMABLE_CLASS, DIMMED_CLASS } from '@utils/motionUtils';
import ImageGroupTable from './components/ImageGroupTable';
import ImageListToolbar from './components/ImageListToolbar';
import ImagePreviewDialog from './components/ImagePreviewDialog';
import ImageTable from './components/ImageTable';
import { useImageListParams } from './hooks/useImageListParams';
import { ImageViewUtil } from './imageListUtils';

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
  const isFiltered = query.length > 0 || chips.length > 0;
  const hasImages = total > 0;

  const clearAll = () => {
    setQuery('');
    clearFilters();
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Images" description={TOTAL_DESCRIBER_MAP[data.view](total, isFiltered)}>
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
        {imagesResponse && hasImages ? <ImageTable images={imagesResponse.data} onOpen={setOpenImage} /> : null}
        {groupsResponse && hasImages ? <ImageGroupTable groups={groupsResponse.data} onOpen={setOpenImage} /> : null}
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
        <ListPagination page={data.page} size={data.pageSize} total={total} />
      </div>
      <ImagePreviewDialog image={openImage} onClose={() => setOpenImage(null)} />
    </div>
  );
}

export default ImageList;
