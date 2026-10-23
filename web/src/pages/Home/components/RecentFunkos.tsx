import { ArrowRight } from 'lucide-react';
import type { FunkoApiModel } from '@app-types/models';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import FunkoCard from '@components/FunkoCard';
import FunkoGrid from '@components/FunkoGrid';
import LinkButton from '@components/LinkButton';

type Props = {
  funkos: FunkoApiModel[];
};

function RecentFunkos({ funkos }: Props) {
  if (funkos.length === 0) return null;

  return (
    <section aria-labelledby="recent-heading" className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 id="recent-heading" className="text-lg font-semibold">
          Recently added
        </h2>
        <LinkButton to={FUNKO_ROUTES_PATHS.BASE} variant="ghost" size="sm">
          All funkos
          <ArrowRight data-icon="inline-end" aria-hidden="true" />
        </LinkButton>
      </div>
      <FunkoGrid label="Recently added" density="compact">
        {funkos.map((funko) => (
          <li key={funko.id}>
            <FunkoCard funko={funko} density="compact" />
          </li>
        ))}
      </FunkoGrid>
    </section>
  );
}

export default RecentFunkos;
