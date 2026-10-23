import type { FunkoApiModel } from '@app-types/models';
import FunkoCard from '@components/FunkoCard';
import FunkoGrid from '@components/FunkoGrid';
import type { FunkoGridDensityUtil } from '@app-types/utility';
import FunkoCardSkeleton from './FunkoCardSkeleton';

type Props = {
  funkos: FunkoApiModel[];
  density: FunkoGridDensityUtil;
  isLoadingMore: boolean;
};

const LOADING_CARD_COUNT = 6;

// The next page on its way: placeholder cards in the grid, where the funkos will appear.
function LoadingCards() {
  return Array.from({ length: LOADING_CARD_COUNT }, (_, index) => <FunkoCardSkeleton key={index} />);
}

// The funkos as photo cards, with placeholders at the end while more load.
function FunkoResultsGrid({ funkos, density, isLoadingMore }: Props) {
  return (
    <FunkoGrid label="Funkos" density={density}>
      {funkos.map((funko) => (
        <li key={funko.id}>
          <FunkoCard funko={funko} density={density} />
        </li>
      ))}
      {isLoadingMore ? <LoadingCards /> : null}
    </FunkoGrid>
  );
}

export default FunkoResultsGrid;
