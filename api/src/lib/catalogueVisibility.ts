// Who sees which rows of the shared catalogue (funkos, categories, series; docs/adr/0001-shared-catalogue-own-collections.md),
// as Prisma `where` objects any of the three models accept: they share the `status` and `submittedById` columns.
// The raw funko list in funkos.repository.ts writes the catalogue rule in SQL; keep the two in step.
const APPROVED = 'APPROVED';
const WAITING = 'WAITING';

// Where a unique rule (barcode, identity, name) holds: the approved catalogue (null), or one member's waiting
// submissions. The partial unique indexes of the submissions migration hold the same scopes.
export type SubmitterScope = { submittedById: number | null };

type CatalogueFilter = {
  OR: [{ status: typeof APPROVED }, { status: typeof WAITING; submittedById: number }];
};

type SentInOrApprovedFilter = {
  OR: [{ status: typeof APPROVED }, { submittedById: number }];
};

type ScopeFilter = { status: typeof APPROVED } | { status: typeof WAITING; submittedById: number };

// The catalogue as `userId` browses it (lists, search, suggestions, counts, the barcode lookup, adding to a
// collection): every approved row, and their own waiting submissions. A rejected or merged one is gone from it.
export function catalogueOf(userId: number): CatalogueFilter {
  return { OR: [{ status: APPROVED }, { status: WAITING, submittedById: userId }] };
}

// Everything `userId` may read, whatever became of what they sent in: the export, so their items of a rejected
// submission still name their funko.
export function sentInOrApproved(userId: number): SentInOrApprovedFilter {
  return { OR: [{ status: APPROVED }, { submittedById: userId }] };
}

export function scopeFilter({ submittedById }: SubmitterScope): ScopeFilter {
  if (submittedById === null) return { status: APPROVED };

  return { status: WAITING, submittedById };
}
