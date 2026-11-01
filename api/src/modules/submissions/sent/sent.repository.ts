import type { Prisma } from '../../../generated/prisma/client.ts';
import { toOrderDirection, toSkipTake } from '../../../lib/pagination.ts';
import { prisma } from '../../../lib/prisma.ts';
import { SUBMISSION_SELECT, toSubmissionRow, type SubmissionRow } from '../submissions.repository.ts';
import type { ListSubmissionsQuery, SubmissionSortField } from './sent.schema.ts';

const SUBMISSION_SORT_MAP: Record<SubmissionSortField, keyof Prisma.FunkoOrderByWithRelationInput> = {
  NAME: 'name',
  CREATION_DATE: 'createdAt',
};

export const sentRepository = {
  // What one user sent in, with an optional status.
  listSubmissions: async (
    userId: number,
    query: ListSubmissionsQuery,
  ): Promise<{ data: SubmissionRow[]; totalResultNumber: number }> => {
    const where: Prisma.FunkoWhereInput = { submittedById: userId, status: query.status };
    const sortField = SUBMISSION_SORT_MAP[query.sorting_fields];
    const direction = toOrderDirection(query.direction);

    const [rows, totalResultNumber] = await prisma.$transaction([
      prisma.funko.findMany({
        where,
        select: SUBMISSION_SELECT,
        orderBy: [{ [sortField]: direction }, { id: 'asc' }],
        ...toSkipTake(query),
      }),
      prisma.funko.count({ where }),
    ]);

    return { data: rows.map(toSubmissionRow), totalResultNumber };
  },
};
