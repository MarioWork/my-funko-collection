// Who sees a row of the shared catalogue (a funko, category or series; docs/adr/0001-shared-catalogue-own-collections.md):
// everyone sees the approved ones, and a sender also sees what they sent in. A Prisma `where` for any of the three
// models, which share the `status` and `submittedById` columns.
const APPROVED = 'APPROVED';

type VisibleToFilter = {
  OR: [{ status: typeof APPROVED }, { submittedById: number }];
};

export function visibleTo(userId: number): VisibleToFilter {
  return { OR: [{ status: APPROVED }, { submittedById: userId }] };
}
