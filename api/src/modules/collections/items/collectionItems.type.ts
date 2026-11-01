// What other modules may import from collection items (node-ts-api §3): the condition list the export reuses, and the
// item limits a merge keeps to (submissions/merge/merge.items.ts) so a merged item can still be edited.

// Matches the `ItemCondition` enum in prisma/schema.prisma; the repositories fail to compile if the two drift apart.
export const ITEM_CONDITIONS = ['MINT_IN_BOX', 'BOX_DAMAGED', 'OUT_OF_BOX'] as const;
export type ItemCondition = (typeof ITEM_CONDITIONS)[number];

// The most an item may hold, and the most tags it may carry: the request schemas check them.
export const MAX_QUANTITY = 1000;
export const MAX_TAGS_PER_ITEM = 20;
