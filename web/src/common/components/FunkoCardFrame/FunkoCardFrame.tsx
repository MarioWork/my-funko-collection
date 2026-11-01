import type { ReactNode } from 'react';
import { Link } from 'react-router';
import type { FunkoSummaryApiModel } from '@app-types/models';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import FunkoImage from '@components/FunkoImage';
import { Badge } from '@components/ui/badge';

// The photo's width per grid column count (FunkoGrid); the browser picks the image size from it.
const CARD_SIZES = '(min-width: 1536px) 15vw, (min-width: 1024px) 22vw, (min-width: 640px) 30vw, 45vw';

type FramedFunko = Pick<FunkoSummaryApiModel, 'id' | 'name' | 'primaryImage'>;

type Props = {
  funko: FramedFunko;
  // "×N" in the photo's bottom-right corner, only for more than one copy.
  quantity?: number;
  // What sits in the photo's top-left corner (chase and exclusive badges, an item's collection).
  photoCorner: ReactNode;
  // The text lines under the photo.
  children: ReactNode;
};

// The grid card's shell, shared by the funko card and the All items card: the whole card is a link to the funko,
// the photo first with its corner badges, the caption under it. Hover and keyboard focus outline the photo in the
// primary colour, like the collection cards.
function FunkoCardFrame({ funko, quantity, photoCorner, children }: Props) {
  const hasExtraCopies = quantity !== undefined && quantity > 1;

  return (
    <Link
      viewTransition
      to={FUNKO_ROUTES_PATHS.detail(String(funko.id))}
      className="group flex flex-col gap-2 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="relative aspect-3/4 overflow-hidden rounded-xl bg-card shadow-xs transition-shadow group-hover:ring-2 group-hover:ring-primary group-focus-visible:ring-2 group-focus-visible:ring-primary motion-reduce:transition-none">
        <FunkoImage image={funko.primaryImage} alt={funko.name} sizes={CARD_SIZES} className="size-full" />
        {photoCorner}
        {hasExtraCopies ? (
          <Badge className="absolute right-2 bottom-2" variant="default">
            ×{quantity}
          </Badge>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-col gap-0.5 px-0.5">{children}</div>
    </Link>
  );
}

export default FunkoCardFrame;
