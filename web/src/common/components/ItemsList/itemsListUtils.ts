import type { CollectionItemApiModel } from '@app-types/models';
import { ITEM_CONDITION_LABELS } from '@app-types/utility';
import { formatIsoDate } from '@utils/dateUtils';
import { formatCents } from '@utils/moneyUtils';

// The one-line summary of a copy on a phone card: quantity, then only the facts that are filled in.
export function getItemFacts(item: CollectionItemApiModel): string[] {
  const condition = item.condition ? ITEM_CONDITION_LABELS[item.condition] : null;
  const price = item.purchasePriceCents === null ? null : formatCents(item.purchasePriceCents, item.purchaseCurrency);
  const purchasedAt = item.purchasedAt ? formatIsoDate(item.purchasedAt) : null;

  return [`×${item.quantity}`, condition, price, purchasedAt].filter((fact): fact is string => fact !== null);
}

// The copy's two most telling facts for a grid card ("Out of box · 9,99 €"); the quantity is the card's own badge.
export function getItemGridFacts(item: CollectionItemApiModel): string[] {
  const condition = item.condition ? ITEM_CONDITION_LABELS[item.condition] : null;
  const price = item.purchasePriceCents === null ? null : formatCents(item.purchasePriceCents, item.purchaseCurrency);

  return [condition, price].filter((fact): fact is string => fact !== null);
}

const CHASE_LINE = 'Chase';

type AllItemsCardLines = {
  // "#353 Pikachu".
  title: string;
  // The series, then "Chase" and "Exclusive: <name>" when the funko is one, in that order.
  details: string[];
};

// The text under an All items card: the funko's number and name, then its series, chase and exclusive lines.
export function getAllItemsCardLines({ funko }: CollectionItemApiModel): AllItemsCardLines {
  const chase = funko.isChase ? CHASE_LINE : null;
  const exclusive = funko.exclusive ? `Exclusive: ${funko.exclusive}` : null;

  return {
    title: `#${funko.number} ${funko.name}`,
    details: [funko.series.name, chase, exclusive].filter((line): line is string => line !== null),
  };
}
