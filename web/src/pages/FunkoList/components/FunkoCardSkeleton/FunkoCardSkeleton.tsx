import FunkoFigureArt from '@components/FunkoFigureArt';
import { Skeleton } from '@components/ui/skeleton';

// A funko card still on its way: the app's dashed Pop! figure where the photo will be, two bars for the name and
// number, all softly pulsing. Decorative: the list's footer says in words that more is loading.
function FunkoCardSkeleton() {
  return (
    <li aria-hidden="true" className="flex flex-col gap-2">
      <div className="flex aspect-3/4 items-center justify-center rounded-xl bg-muted text-muted-foreground/40 motion-safe:animate-pulse">
        <FunkoFigureArt className="w-1/2 max-w-28" />
      </div>
      <div className="flex flex-col gap-1.5 px-0.5">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </li>
  );
}

export default FunkoCardSkeleton;
