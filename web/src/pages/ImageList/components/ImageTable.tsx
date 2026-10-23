import type { ImageListEntryApiModel } from '@app-types/models';
import { Table, TableBody } from '@components/ui/table';
import ImageTableHead from './ImageTableHead';
import ImageTableRow from './ImageTableRow';

type Props = {
  images: ImageListEntryApiModel[];
  onOpen: (image: ImageListEntryApiModel) => void;
};

// Facts only, no pictures: the list stays light however many images there are. A row opens its preview.
function ImageTable({ images, onOpen }: Props) {
  return (
    <Table>
      <ImageTableHead firstLabel="Image" />
      <TableBody>
        {images.map((image) => (
          <ImageTableRow key={image.key} image={image} onOpen={onOpen} />
        ))}
      </TableBody>
    </Table>
  );
}

export default ImageTable;
