import type { NamedApiModel } from '@app-types/models';
import { ITEM_CONDITION_LABELS } from '@app-types/utility';
import { PRICE_PATTERN, type ItemFormValues } from '@components/ItemFormFields';
import { formatCents, unitsToCents } from '@utils/moneyUtils';

const SEPARATOR = ' · ';

function priceText(price: string): string | undefined {
  const isValidPrice = PRICE_PATTERN.test(price.trim());

  if (!isValidPrice) return undefined;

  return formatCents(unitsToCents(price.trim().replace(',', '.')));
}

// A folded collection card's one line: "×2 · Mint in box · 14,99 € · Box 3". Only what is filled in; the values
// come from a live watch, so any of them may still be missing.
export function itemSummary(values: Partial<ItemFormValues>, tags: NamedApiModel[]): string {
  const { quantity, condition, price = '', tagIds = [] } = values;
  const conditionLabel = condition ? ITEM_CONDITION_LABELS[condition] : undefined;
  const tagNames = tags.filter((tag) => tagIds.includes(tag.id)).map((tag) => tag.name);
  const parts = [`×${quantity ?? ''}`, conditionLabel, priceText(price), ...tagNames];

  return parts.filter((part) => part !== undefined).join(SEPARATOR);
}
