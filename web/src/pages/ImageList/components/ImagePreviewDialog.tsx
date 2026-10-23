import { Package } from 'lucide-react';
import type { ImageListEntryApiModel } from '@app-types/models';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import ImageDownloadButton from '@components/ImageDownloadButton';
import LinkButton from '@components/LinkButton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@components/ui/dialog';
import { formatBytes } from '@utils/byteUtils';
import { formatDateTime } from '@utils/dateUtils';
import { imageDimensions, imageTitle } from '../imageListUtils';

type Props = {
  image: ImageListEntryApiModel | null;
  onClose: () => void;
};

type BodyProps = {
  image: ImageListEntryApiModel;
};

const FILE_EXTENSION = /\.webp$/;

// The picture itself, its facts on one line, and what you can do with it: open its funko, download it.
function PreviewBody({ image }: BodyProps) {
  const pictureUrl = image.mediumUrl ?? image.url;
  const facts = [imageDimensions(image), formatBytes(image.sizeBytes), formatDateTime(image.createdAt)].join(' · ');

  return (
    <>
      <DialogHeader>
        <DialogTitle>{imageTitle(image)}</DialogTitle>
        <DialogDescription>
          {image.fileName} · {facts}
        </DialogDescription>
      </DialogHeader>
      {pictureUrl ? (
        <img
          src={pictureUrl}
          alt={imageTitle(image)}
          className="max-h-[65svh] w-full rounded-lg bg-muted object-contain"
        />
      ) : (
        <p className="text-sm text-muted-foreground">None of its stored sizes are left on disk.</p>
      )}
      <div className="flex items-center justify-end gap-2">
        {image.funko ? (
          <LinkButton to={FUNKO_ROUTES_PATHS.detail(String(image.funko.id))} variant="outline">
            <Package data-icon="inline-start" aria-hidden="true" />
            Open funko
          </LinkButton>
        ) : null}
        {image.url ? (
          <ImageDownloadButton
            url={image.url}
            funkoName={image.funko?.name ?? image.fileName.replace(FILE_EXTENSION, '')}
            imageNumber={image.id ?? 0}
          />
        ) : null}
      </div>
    </>
  );
}

// Opened from a row: the only place on the Images page that loads a picture.
function ImagePreviewDialog({ image, onClose }: Props) {
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) onClose();
  };

  return (
    <Dialog open={image !== null} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">{image ? <PreviewBody image={image} /> : null}</DialogContent>
    </Dialog>
  );
}

export default ImagePreviewDialog;
