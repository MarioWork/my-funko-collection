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
