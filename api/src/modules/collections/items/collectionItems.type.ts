// What other modules may import from collection items (node-ts-api §3): the condition list the export reuses.

// Matches the `ItemCondition` enum in prisma/schema.prisma; the repositories fail to compile if the two drift apart.
export const ITEM_CONDITIONS = ['MINT_IN_BOX', 'BOX_DAMAGED', 'OUT_OF_BOX'] as const;
export type ItemCondition = (typeof ITEM_CONDITIONS)[number];
