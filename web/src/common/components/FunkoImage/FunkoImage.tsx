import type { PrimaryImageApiModel } from '@app-types/models';
import { cn } from '@utils/classNameUtils';
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

const SMALL_WIDTH = 480;
const MEDIUM_WIDTH = 1200;

// srcset over the API's three variants, the blur placeholder as background until the real file lands, explicit
// dimensions so nothing jumps. Dark mode dims white box backgrounds slightly and adds a hairline ring.
function FunkoImage({ image, alt, sizes, fit = 'cover', isPriority = false, className }: Props) {
  if (!image) {
    return (
      <div
        role="img"
        aria-label={`${alt} (no photo yet)`}
        className={cn('flex items-center justify-center bg-muted text-muted-foreground', className)}
      >
        <FunkoFigureArt className="w-1/2 max-w-32" />
      </div>
    );
  }

  return (
    <img
      src={image.smallUrl}
      srcSet={`${image.smallUrl} ${SMALL_WIDTH}w, ${image.mediumUrl} ${MEDIUM_WIDTH}w`}
      sizes={sizes}
      alt={alt}
      width={image.width}
      height={image.height}
      loading={isPriority ? 'eager' : 'lazy'}
      decoding="async"
      style={{ backgroundImage: `url(${image.placeholder})` }}
      className={cn(
        'bg-cover bg-center dark:ring-1 dark:ring-white/10 dark:brightness-90',
        fit === 'cover' ? 'object-cover' : 'object-contain',
        className,
      )}
    />
  );
}

export default FunkoImage;
