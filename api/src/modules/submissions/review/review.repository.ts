import type { Prisma } from '../../../generated/prisma/client.ts';
import { toSkipTake } from '../../../lib/pagination.ts';
import { prisma } from '../../../lib/prisma.ts';
import {
  SUBMISSION_SELECT,
  toSubmissionRow,
  type CatalogueReferences,
  type SubmissionRow,
} from '../submissions.repository.ts';
import type { ListReviewQuery, ReviewState } from './review.schema.ts';

// What the double check compares: the barcode, and the number with the category's name; plus chase and exclusive, so
// look-alikes (a regular and a chase of the same number and name) can be told apart.
const DOUBLE_CANDIDATE_SELECT = {
  id: true,
  name: true,
  number: true,
  isChase: true,
  exclusive: true,
  barcode: true,
  status: true,
  category: { select: { name: true } },
} as const satisfies Prisma.FunkoSelect;

export type DoubleCandidateRow = Prisma.FunkoGetPayload<{ select: typeof DOUBLE_CANDIDATE_SELECT }>;

// What a submission's double check looks for.
export type DoubleProbe = { id: number; barcode: string | null; number: string; categoryName: string };

type ReviewTab = { where: Prisma.FunkoWhereInput; orderBy: Prisma.FunkoOrderByWithRelationInput[] };

// The review list's tabs: what each holds and in which order.
const REVIEW_STATE_MAP: Record<ReviewState, ReviewTab> = {
  WAITING: { where: { status: 'WAITING' }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] },
  DONE: {
    where: { status: { not: 'WAITING' }, reviewedAt: { not: null } },
    orderBy: [{ reviewedAt: 'desc' }, { id: 'desc' }],
  },
};

// Approved and waiting funkos (never rejected or merged ones) with any of the probes' barcodes, or any of their
// numbers in a category of the same name (any case).
function doubleCandidatesFilter(probes: DoubleProbe[]): Prisma.FunkoWhereInput {
  const barcodes = probes.flatMap((probe) => (probe.barcode ? [probe.barcode] : []));
  const sameNumberAndCategory = probes.map((probe) => ({
    number: probe.number,
    category: { name: { equals: probe.categoryName, mode: 'insensitive' as const } },
  }));

  return {
    status: { in: ['APPROVED', 'WAITING'] },
    OR: [{ barcode: { in: barcodes } }, ...sameNumberAndCategory],
  };
}

// The one that was left behind when a funko moved from `currentId` to `nextId`, if it moved.
function leftBehind(currentId: number | undefined, nextId: number): number | undefined {
  const hasMoved = currentId !== undefined && currentId !== nextId;

  return hasMoved ? currentId : undefined;
}

// Approving, all or nothing: the funko moves to `references`, the waiting category and series it keeps join the
// catalogue with it, and a waiting one it left for an approved twin goes once no funko uses it.
async function approveInTransaction(id: number, references: CatalogueReferences): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const current = await tx.funko.findUnique({ where: { id }, select: { categoryId: true, seriesId: true } });
    const leftCategoryId = leftBehind(current?.categoryId, references.categoryId);
    const leftSeriesId = leftBehind(current?.seriesId, references.seriesId);
    const unusedSubmission = { status: { not: 'APPROVED' as const }, funkos: { none: {} } };

    await tx.category.updateMany({
      where: { id: references.categoryId, status: 'WAITING' },
      data: { status: 'APPROVED' },
    });

    await tx.series.updateMany({
      where: { id: references.seriesId, status: 'WAITING' },
      data: { status: 'APPROVED' },
    });

    const write = await tx.funko.updateMany({
      where: { id, status: 'WAITING' },
      data: { ...references, status: 'APPROVED', reviewedAt: new Date() },
    });

    if (leftCategoryId !== undefined)
      await tx.category.deleteMany({ where: { id: leftCategoryId, ...unusedSubmission } });

    if (leftSeriesId !== undefined) await tx.series.deleteMany({ where: { id: leftSeriesId, ...unusedSubmission } });

    return write.count > 0;
  });
}

async function deleteOrphanInTransaction(id: number): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const funko = await tx.funko.findUnique({ where: { id }, select: { categoryId: true, seriesId: true } });
    const unusedOrphanReference = { status: { not: 'APPROVED' as const }, submittedById: null, funkos: { none: {} } };

    await tx.collectionItem.deleteMany({ where: { funkoId: id, funko: { status: 'WAITING', submittedById: null } } });

    const deleted = await tx.funko.deleteMany({ where: { id, status: 'WAITING', submittedById: null } });

    if (funko) await tx.category.deleteMany({ where: { id: funko.categoryId, ...unusedOrphanReference } });

    if (funko) await tx.series.deleteMany({ where: { id: funko.seriesId, ...unusedOrphanReference } });

    return deleted.count > 0;
  });
}

export const reviewRepository = {
  // Every member's submissions, for the admins: the waiting ones, or the reviewed ones.
  listForReview: async (query: ListReviewQuery): Promise<{ data: SubmissionRow[]; totalResultNumber: number }> => {
    const { where, orderBy } = REVIEW_STATE_MAP[query.state];

    const [rows, totalResultNumber] = await prisma.$transaction([
      prisma.funko.findMany({ where, select: SUBMISSION_SELECT, orderBy, ...toSkipTake(query) }),
      prisma.funko.count({ where }),
    ]);

    return { data: rows.map(toSubmissionRow), totalResultNumber };
  },

  // Every approved or waiting funko that shares a barcode, or a number and category name, with one of the probes
  // (the probes themselves included: the caller leaves each one's own row out).
  findDoubleCandidates: async (probes: DoubleProbe[]): Promise<DoubleCandidateRow[]> => {
    if (probes.length === 0) return [];

    return prisma.funko.findMany({
      where: doubleCandidatesFilter(probes),
      select: DOUBLE_CANDIDATE_SELECT,
      orderBy: { id: 'asc' },
    });
  },

  // Only a waiting funko is approved (false otherwise). A unique index the catalogue now holds the funko, category or
  // series against throws 23505, and nothing changes.
  approve: approveInTransaction,

  // Only a waiting funko is rejected (false otherwise); its waiting category and series stay its sender's.
  reject: async (id: number, rejectionReason: string): Promise<boolean> => {
    const write = await prisma.funko.updateMany({
      where: { id, status: 'WAITING' },
      data: { status: 'REJECTED', rejectionReason, reviewedAt: new Date() },
    });

    return write.count > 0;
  },

  // Rejecting an orphan submission deletes it, as the user-delete trigger deletes a removed user's rejected ones:
  // its items (there should be none), the funko, and the never-approved category and series of the removed user that
  // no funko uses any more. Only a waiting orphan goes (false otherwise). Its image files stay for images:prune.
  deleteOrphan: deleteOrphanInTransaction,
};
