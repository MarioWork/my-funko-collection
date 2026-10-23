import { Link } from 'react-router';
import type { CollectionItemApiModel } from '@app-types/models';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import FunkoImage from '@components/FunkoImage';
import { Badge } from '@components/ui/badge';
import { useItemsListContext } from '../hooks/useItemsListContext';
import { getItemFacts } from '../itemsListUtils';
import ItemRowMenu from './ItemRowMenu';
import { funkosInCategoryPath } from '@utils/funkoLinkUtils';
import { cn } from '@utils/classNameUtils';
import { DIMMED_CLASS, FADE_IN_CLASS } from '@utils/motionUtils';
import { LINK_FOCUS_CLASS } from '@utils/focusUtils';

type Props = {
  item: CollectionItemApiModel;
};

const THUMB_SIZES = '72px';

// The phone layout of a row: thumbnail, name, number, the facts in one line, tags, the menu.
function ItemCard({ item }: Props) {
  const { hasCollectionFilter, busyItemId } = useItemsListContext();
  const isBusy = busyItemId === item.id;

  return (
    <li
      className={cn(
        'flex gap-3 rounded-xl border bg-card p-3 transition-[box-shadow,opacity] focus-within:ring-2 focus-within:ring-primary hover:ring-2 hover:ring-primary',
        FADE_IN_CLASS,
        isBusy && DIMMED_CLASS,
      )}
    >
      <FunkoImage
        image={item.funko.primaryImage}
        alt=""
        sizes={THUMB_SIZES}
        className="aspect-3/4 w-16 shrink-0 rounded-lg"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Link
          viewTransition
          to={FUNKO_ROUTES_PATHS.detail(String(item.funko.id))}
          className={cn('truncate text-sm font-medium underline-offset-4 hover:underline', LINK_FOCUS_CLASS)}
        >
          {item.funko.name}
        </Link>
        <p className="truncate text-xs text-muted-foreground">
          #{item.funko.number} ·{' '}
          <Link
            viewTransition
            to={funkosInCategoryPath(item.funko.category.id)}
            className={cn('underline-offset-4 hover:text-foreground hover:underline', LINK_FOCUS_CLASS)}
          >
            {item.funko.category.name}
          </Link>
          {hasCollectionFilter ? ` · ${item.collection.name}` : ''}
        </p>
        <p className="text-xs text-muted-foreground">{getItemFacts(item).join(' · ')}</p>
        {item.tags.length > 0 ? (
          <ul className="flex flex-wrap gap-1" aria-label="Tags">
            {item.tags.map((tag) => (
              <li key={tag.id}>
                <Badge variant="outline">{tag.name}</Badge>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <ItemRowMenu item={item} />
    </li>
  );
}

export default ItemCard;
