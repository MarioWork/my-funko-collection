import type { ImageListEntryApiModel } from '@app-types/models';
import { Badge } from '@components/ui/badge';
import { TableCell, TableRow } from '@components/ui/table';
import { formatBytes } from '@utils/byteUtils';
import { cn } from '@utils/classNameUtils';
import { formatDateTime } from '@utils/dateUtils';
import { FADE_IN_CLASS } from '@utils/motionUtils';
import { COMPLETE_SIZE_COUNT, imageDimensions, imageTitle } from '../imageListUtils';

type Props = {
  image: ImageListEntryApiModel;
  // Inside an open funko group: indented, and named by its file since the group already names the funko.
  isNested?: boolean;
  onOpen: (image: ImageListEntryApiModel) => void;
};

type BadgesProps = {
  image: ImageListEntryApiModel;
};

// What is worth a second look, in words (never colour alone): the funko's main image, a file no funko uses,
// stored sizes gone missing.
function ImageBadges({ image }: BadgesProps) {
  const isMissingSizes = image.sizeCount < COMPLETE_SIZE_COUNT;

  return (
    <>
      {image.isMain ? <Badge variant="secondary">Main</Badge> : null}
      {image.funko ? null : <Badge variant="outline">Not being used</Badge>}
      {isMissingSizes ? (
        <Badge variant="outline">
          {image.sizeCount} of {COMPLETE_SIZE_COUNT} sizes
        </Badge>
      ) : null}
    </>
  );
}

// A row is one button stretched over the whole row (after:inset-0): clicking anywhere opens the preview.
function ImageTableRow({ image, isNested = false, onOpen }: Props) {
  const title = isNested ? image.fileName : imageTitle(image);

  return (
    <TableRow className={cn('relative', isNested && cn('bg-muted/40', FADE_IN_CLASS))}>
      <TableCell className={cn('max-w-0 min-w-48', isNested && 'pl-10')}>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onOpen(image)}
            aria-label={`Preview ${imageTitle(image)}, ${image.fileName}`}
            className="truncate rounded-sm text-left font-medium outline-none after:absolute after:inset-0 focus-visible:ring-2 focus-visible:ring-ring"
          >
            {title}
          </button>
          <ImageBadges image={image} />
        </div>
        {isNested ? null : <p className="truncate text-xs text-muted-foreground">{image.fileName}</p>}
      </TableCell>
      <TableCell className="hidden whitespace-nowrap tabular-nums @3xl:table-cell">{imageDimensions(image)}</TableCell>
      <TableCell className="whitespace-nowrap tabular-nums">{formatBytes(image.sizeBytes)}</TableCell>
      <TableCell className="hidden whitespace-nowrap tabular-nums @3xl:table-cell">
        {formatDateTime(image.createdAt)}
      </TableCell>
    </TableRow>
  );
}

export default ImageTableRow;
