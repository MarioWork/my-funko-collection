import { useState } from 'react';
import type { PrimaryImageApiModel } from '@app-types/models';
import { cn } from '@utils/classNameUtils';
import { MEDIUM_IMAGE_WIDTH_PX, SMALL_IMAGE_WIDTH_PX } from '@utils/imageSizeUtils';
import FunkoFigureArt from '@components/FunkoFigureArt';

type Props = {
  image: PrimaryImageApiModel | null;
  alt: string;
  // The CSS width the image will occupy, so the browser picks the right variant for the screen density.
  sizes: string;
  // Grid tiles crop to 3:4; the detail page shows the whole photo.
  fit?: 'cover' | 'contain';
  isPriority?: boolean;
  className?: string;
};

type LoadedImageProps = {
  image: PrimaryImageApiModel;
  alt: string;
  sizes: string;
  fit: 'cover' | 'contain';
  isPriority: boolean;
};

const FIT_CLASS_MAP: Record<LoadedImageProps['fit'], string> = {
  cover: 'object-cover',
  contain: 'object-contain',
};

// The real file, invisible until it has loaded, then faded in over the blur. An image the browser already had
// (cached, or done before React attached onLoad) is caught by the ref and shown at once.
function LoadedImage({ image, alt, sizes, fit, isPriority }: LoadedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  const markIfComplete = (element: HTMLImageElement | null) => {
    if (element?.complete) setIsLoaded(true);
  };

  return (
    <img
      ref={markIfComplete}
      src={image.smallUrl}
      srcSet={`${image.smallUrl} ${SMALL_IMAGE_WIDTH_PX}w, ${image.mediumUrl} ${MEDIUM_IMAGE_WIDTH_PX}w`}
      sizes={sizes}
      alt={alt}
      width={image.width}
      height={image.height}
      loading={isPriority ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={() => setIsLoaded(true)}
      className={cn(
        'block size-full motion-safe:transition-opacity motion-safe:duration-300 motion-safe:ease-standard',
        FIT_CLASS_MAP[fit],
        !isLoaded && 'opacity-0',
      )}
    />
  );
}

// srcset over the API's three variants, the blur placeholder behind it until the real file fades in, explicit
// dimensions so nothing jumps. Keyed by the file, so switching to another image (the gallery) fades in again.
// Dark mode dims white box backgrounds slightly and adds a hairline ring.
function FunkoImage({ image, alt, sizes, fit = 'cover', isPriority = false, className }: Props) {
  if (!image) {
    return (
      <div
        role="img"
        aria-label={`${alt} (no image yet)`}
        className={cn('flex items-center justify-center bg-muted text-muted-foreground', className)}
      >
        <FunkoFigureArt className="w-1/2 max-w-32" />
      </div>
    );
  }

  return (
    <span
      style={{ backgroundImage: `url(${image.placeholder})` }}
      className={cn('block overflow-hidden bg-cover bg-center ring-1 ring-image-ring dark:brightness-90', className)}
    >
      <LoadedImage key={image.smallUrl} image={image} alt={alt} sizes={sizes} fit={fit} isPriority={isPriority} />
    </span>
  );
}

export default FunkoImage;
