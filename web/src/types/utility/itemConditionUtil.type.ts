// Mirrors ITEM_CONDITIONS in api/src/db/schema/collectionItems.ts.
export const ItemConditionUtil = {
  MINT_IN_BOX: 'MINT_IN_BOX',
  BOX_DAMAGED: 'BOX_DAMAGED',
  OUT_OF_BOX: 'OUT_OF_BOX',
} as const;
export type ItemConditionUtil = (typeof ItemConditionUtil)[keyof typeof ItemConditionUtil];

export const ITEM_CONDITION_LABELS: Record<ItemConditionUtil, string> = {
  MINT_IN_BOX: 'Mint in box',
  BOX_DAMAGED: 'Box damaged',
  OUT_OF_BOX: 'Out of box',
};
