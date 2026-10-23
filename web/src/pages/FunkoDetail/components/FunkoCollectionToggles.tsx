import { Bookmark, Heart, type LucideIcon } from 'lucide-react';
import type { CollectionApiModel, CollectionItemApiModel, FunkoDetailApiModel } from '@app-types/models';
import DisabledReason from '@components/DisabledReason';
import { Toggle } from '@components/ui/toggle';
import { Tooltip, TooltipContent, TooltipTrigger } from '@components/ui/tooltip';
import { cn } from '@utils/classNameUtils';
import { WISHLIST_COLLECTION_NAME } from '@utils/collectionUtils';
import { DISABLED_REASONS } from '@utils/disabledReasonUtils';
import { useFunkoMemberships } from '../hooks/useFunkoMemberships';

type Props = {
  funko: FunkoDetailApiModel;
  collections: CollectionApiModel[];
  items: CollectionItemApiModel[];
};

type ToggleProps = {
  collection: CollectionApiModel;
  icon: LucideIcon;
  isMember: boolean;
  isBusy: boolean;
  onToggle: (collection: CollectionApiModel) => void;
};

type QuickCollection = { collection: CollectionApiModel; icon: LucideIcon };

// Round icon buttons: an outline when the funko is not in the collection, a filled icon on a soft primary tint when
// it is. Named after the collection; pressed state says which.
const TOGGLE_CLASS =
  'size-9 rounded-full bg-card p-0 aria-pressed:border-primary aria-pressed:bg-selected aria-pressed:text-selected-foreground';

function CollectionToggle({ collection, icon: Icon, isMember, isBusy, onToggle }: ToggleProps) {
  const hint = isMember ? `In ${collection.name} · tap to remove` : `Add to ${collection.name}`;
  const toggle = (
    <Toggle
      variant="outline"
      aria-label={collection.name}
      pressed={isMember}
      disabled={isBusy}
      onPressedChange={() => onToggle(collection)}
      className={TOGGLE_CLASS}
    >
      <Icon aria-hidden="true" className={cn(isMember && 'fill-current')} />
    </Toggle>
  );

  if (isBusy) {
    return (
      <DisabledReason reason={DISABLED_REASONS.WORKING} mode="wrapper">
        {toggle}
      </DisabledReason>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger render={toggle} />
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  );
}

// The two collections a funko moves between most, as one-tap icons beside its name: the default one (Owned, a
// bookmark) and the Wishlist (a heart). Every other collection is in ⋯ → Lists.
function FunkoCollectionToggles({ funko, collections, items }: Props) {
  const { memberIds, isBusy, toggle } = useFunkoMemberships({ funko, items });
  const defaultCollection = collections.find((collection) => collection.isDefault);
  const wishlist = collections.find(
    (collection) => collection.name === WISHLIST_COLLECTION_NAME && !collection.isDefault,
  );
  const quickCollections = [
    { collection: defaultCollection, icon: Bookmark },
    { collection: wishlist, icon: Heart },
  ].filter((entry): entry is QuickCollection => entry.collection !== undefined);

  return (
    <div className="flex items-center gap-1">
      {quickCollections.map(({ collection, icon }) => (
        <CollectionToggle
          key={collection.id}
          collection={collection}
          icon={icon}
          isMember={memberIds.has(collection.id)}
          isBusy={isBusy}
          onToggle={toggle}
        />
      ))}
    </div>
  );
}

export default FunkoCollectionToggles;
