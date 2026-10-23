import type { ImageListEntryApiModel } from '@app-types/models';
import TableSkeletonRows from '@components/TableSkeletonRows';
import { Table, TableBody } from '@components/ui/table';
import { IMAGE_SKELETON_COLUMNS } from '../imageListUtils';
import ImageTableHead from './ImageTableHead';
import ImageTableRow from './ImageTableRow';

type Props = {
  images: ImageListEntryApiModel[];
  onOpen: (image: ImageListEntryApiModel) => void;
  // The next page is loading: placeholder rows under the last one.
  isLoadingMore?: boolean;
};

// Facts only, no pictures: the list stays light however many images there are. A row opens its preview.
function ImageTable({ images, onOpen, isLoadingMore = false }: Props) {
  return (
    <Table>
      <ImageTableHead firstLabel="Image" />
      <TableBody>
        {images.map((image) => (
          <ImageTableRow key={image.key} image={image} onOpen={onOpen} />
        ))}
        {isLoadingMore ? <TableSkeletonRows columnClassNames={IMAGE_SKELETON_COLUMNS} /> : null}
      </TableBody>
    </Table>
  );
}

export default ImageTable;
