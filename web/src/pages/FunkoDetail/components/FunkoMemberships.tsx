import { useState, ViewTransition } from 'react';
import type { CollectionItemApiModel } from '@app-types/models';
import { ITEM_CONDITION_LABELS } from '@app-types/utility';
import FoldPanel from '@components/FoldPanel';
import FoldToggle from '@components/FoldToggle';
import { useItemActions } from '@hooks/useItemActions';
import { cn } from '@utils/classNameUtils';
import { formatCents } from '@utils/moneyUtils';
import { DIMMABLE_CLASS, DIMMED_CLASS, FADE_IN_CLASS, LIST_ITEM_TRANSITION_CLASS } from '@utils/motionUtils';
import MembershipActions from './MembershipActions';
import MembershipDetails from './MembershipDetails';

type Props = {
  items: CollectionItemApiModel[];
};

type RowProps = {
  item: CollectionItemApiModel;
  isBusy: boolean;
  onRemove: (item: CollectionItemApiModel) => void;
};

const HEADING_ID = 'memberships-heading';
const ROW_ID_PREFIX = 'membership';
const SUMMARY_SEPARATOR = ' · ';

// A folded row's quick look, beside the collection's name: "×2 · Mint in box · 14,99 € · Box 3".
function quickLook(item: CollectionItemApiModel): string {
  const condition = item.condition ? ITEM_CONDITION_LABELS[item.condition] : undefined;
  const price =
    item.purchasePriceCents === null ? undefined : formatCents(item.purchasePriceCents, item.purchaseCurrency);
  const parts = [`×${item.quantity}`, condition, price, ...item.tags.map((tag) => tag.name)];

  return parts.filter((part) => part !== undefined).join(SUMMARY_SEPARATOR);
}

// One collection the funko is in, as an accordion row: folded, the name and a quick look; unfolded, every detail
// including the notes. The ⋯ menu (edit, remove) stays on the row either way.
function MembershipRow({ item, isBusy, onRemove }: RowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const idPrefix = `${ROW_ID_PREFIX}-${item.id}`;
  const panelId = `${idPrefix}-panel`;

  return (
    <li
      className={cn('flex flex-col py-2 first:pt-0 last:pb-0', FADE_IN_CLASS, DIMMABLE_CLASS, isBusy && DIMMED_CLASS)}
    >
      <div className="flex items-center justify-between gap-2">
        <FoldToggle
          headingId={`${idPrefix}-heading`}
          panelId={panelId}
          title={item.collection.name}
          isOpen={isOpen}
          summary={quickLook(item)}
          onToggle={() => setIsOpen(!isOpen)}
        />
        <MembershipActions item={item} isBusy={isBusy} onRemove={onRemove} />
      </div>
      <FoldPanel id={panelId} isOpen={isOpen}>
        <MembershipDetails item={item} />
      </FoldPanel>
    </li>
  );
}

// The collections this funko sits in: one tile, a compact row per collection divided by hairlines. Removal is
// undoable from the toast. It may shrink (min-h-0): beside the gallery it fills what is left of the screen and its
// list scrolls inside it instead of the page.
function FunkoMemberships({ items }: Props) {
  const { busyItemId, remove } = useItemActions();

  return (
    <section aria-labelledby={HEADING_ID} className="flex min-h-0 flex-col gap-3 rounded-xl border bg-card p-4">
      <h2 id={HEADING_ID} className="text-lg font-semibold">
        Collections
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Not in any collection yet. Use the icons by the name to add it.</p>
      ) : (
        <ul className="-mr-3 -ml-1 flex min-h-0 flex-col divide-y overflow-y-auto pr-3 pl-1">
          {items.map((item) => (
            <ViewTransition key={item.id} default={LIST_ITEM_TRANSITION_CLASS}>
              <MembershipRow item={item} isBusy={busyItemId === item.id} onRemove={remove} />
            </ViewTransition>
          ))}
        </ul>
      )}
    </section>
  );
}

export default FunkoMemberships;
