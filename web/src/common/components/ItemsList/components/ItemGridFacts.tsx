import type { CollectionItemApiModel } from '@app-types/models';
import { Badge } from '@components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@components/ui/tooltip';
import { getItemGridFacts } from '../itemsListUtils';

type Props = {
  item: CollectionItemApiModel;
};

type TagsProps = {
  tags: CollectionItemApiModel['tags'];
};

// More than this and the rest fold into "+N", so every card keeps one line of tags.
const VISIBLE_TAGS = 2;

function GridTags({ tags }: TagsProps) {
  const visible = tags.slice(0, VISIBLE_TAGS);
  const hiddenCount = tags.length - visible.length;
  const allNames = tags.map((tag) => tag.name).join(', ');

  return (
    <ul className="flex min-w-0 flex-nowrap gap-1 overflow-hidden" aria-label="Tags">
      {visible.map((tag) => (
        <li key={tag.id} className="min-w-0">
          <Badge variant="outline" className="max-w-full truncate">
            {tag.name}
          </Badge>
        </li>
      ))}
      {hiddenCount > 0 ? (
        <li className="shrink-0">
          <Tooltip>
            <TooltipTrigger
              render={<Badge variant="outline" tabIndex={0} aria-label={`${tags.length} tags: ${allNames}`} />}
            >
              +{hiddenCount}
            </TooltipTrigger>
            <TooltipContent>{allNames}</TooltipContent>
          </Tooltip>
        </li>
      ) : null}
    </ul>
  );
}

// Under a large grid card: your copy's condition and price, then its tags (where it is, like "Box 3"). Each part
// only when there is something to show.
function ItemGridFacts({ item }: Props) {
  const facts = getItemGridFacts(item);
  const hasTags = item.tags.length > 0;

  if (facts.length === 0 && !hasTags) return null;

  return (
    <div className="flex flex-col gap-1 px-0.5 pt-1">
      {facts.length > 0 ? (
        <p className="truncate text-xs text-muted-foreground tabular-nums">{facts.join(' · ')}</p>
      ) : null}
      {hasTags ? <GridTags tags={item.tags} /> : null}
    </div>
  );
}

export default ItemGridFacts;
