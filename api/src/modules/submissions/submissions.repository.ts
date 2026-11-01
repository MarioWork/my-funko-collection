// What the submissions jobs share: a submission is a funko row, read here with Prisma (no funkos repository import),
// with how its review went.
import type { Prisma } from '../../generated/prisma/client.ts';
import { scopeFilter, type SubmitterScope } from '../../lib/catalogueVisibility.ts';
import { ID_SELECT, prisma } from '../../lib/prisma.ts';
import type { FunkoIdentity, FunkoRow } from '../funkos/funkos.type.ts';
import type { SubmissionStatus } from './submissions.type.ts';

const FUNKO_SELECT = {
  id: true,
  name: true,
  number: true,
  type: true,
  isChase: true,
  exclusive: true,
  barcode: true,
  categoryId: true,
  category: { select: { name: true } },
  seriesId: true,
  series: { select: { name: true } },
  status: true,
  submittedById: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.FunkoSelect;

// How a submission's review went (with the catalogue funko a merged one went into), and who sent it in (null for no
// sender: an admin's funko, or a deleted user's): what the submissions lists add.
const REVIEW_SELECT = {
  reviewedAt: true,
  rejectionReason: true,
  changedByAdminAt: true,
  mergedInto: { select: { id: true, name: true } },
  submittedBy: { select: { id: true, name: true } },
} as const satisfies Prisma.FunkoSelect;

export const SUBMISSION_SELECT = { ...FUNKO_SELECT, ...REVIEW_SELECT } as const satisfies Prisma.FunkoSelect;

// A category's or series' standing and name, to find the approved one of the same name when a submission is approved.
const REFERENCE_SELECT = { id: true, name: true, status: true } as const satisfies Prisma.CategorySelect;

type ReviewColumns = Prisma.FunkoGetPayload<{ select: typeof REVIEW_SELECT }>;

// A funko as the submissions lists show it: the funko, how its review went and who sent it in.
export type SubmissionRow = FunkoRow & ReviewColumns;

// The category and series an approved funko ends up with: its own, or the approved one of the same name.
export type CatalogueReferences = { categoryId: number; seriesId: number };

type ReferenceRow = { id: number; name: string; status: SubmissionStatus };

type ApprovedTwinFinder = (name: string) => Promise<{ id: number } | null>;

function toRow({ category, series, ...funko }: Prisma.FunkoGetPayload<{ select: typeof FUNKO_SELECT }>): FunkoRow {
  return { ...funko, categoryName: category.name, seriesName: series.name };
}

export function toSubmissionRow({
  category,
  series,
  ...funko
}: Prisma.FunkoGetPayload<{ select: typeof SUBMISSION_SELECT }>): SubmissionRow {
  return { ...funko, categoryName: category.name, seriesName: series.name };
}

// An approved reference stays; a waiting one gives way to the approved one of the same name, if there is one.
async function catalogueReferenceId(reference: ReferenceRow, findApprovedTwin: ApprovedTwinFinder): Promise<number> {
  if (reference.status === 'APPROVED') return reference.id;

  const twin = await findApprovedTwin(reference.name);

  return twin?.id ?? reference.id;
}

const findApprovedCategory: ApprovedTwinFinder = (name) =>
  prisma.category.findFirst({ where: { name, status: 'APPROVED' }, select: ID_SELECT });

const findApprovedSeries: ApprovedTwinFinder = (name) =>
  prisma.series.findFirst({ where: { name, status: 'APPROVED' }, select: ID_SELECT });

export const submissionsRepository = {
  findById: async (id: number): Promise<FunkoRow | undefined> => {
    const funko = await prisma.funko.findUnique({ where: { id }, select: FUNKO_SELECT });

    return funko ? toRow(funko) : undefined;
  },

  findSubmission: async (funkoId: number): Promise<SubmissionRow | undefined> => {
    const funko = await prisma.funko.findUnique({ where: { id: funkoId }, select: SUBMISSION_SELECT });

    return funko ? toSubmissionRow(funko) : undefined;
  },

  findIdByBarcode: async (barcode: string, scope: SubmitterScope) =>
    (await prisma.funko.findFirst({ where: { barcode, ...scopeFilter(scope) }, select: ID_SELECT })) ?? undefined,

  findIdByIdentity: async (identity: FunkoIdentity, scope: SubmitterScope) =>
    (await prisma.funko.findFirst({ where: { ...identity, ...scopeFilter(scope) }, select: ID_SELECT })) ?? undefined,

  // The category and series the funko would have in the catalogue: its own approved ones, or for a waiting one the
  // approved one of the same name (an admin may have added it meanwhile), else the waiting one itself.
  findCatalogueReferences: async (funkoId: number): Promise<CatalogueReferences | undefined> => {
    const funko = await prisma.funko.findUnique({
      where: { id: funkoId },
      select: { category: { select: REFERENCE_SELECT }, series: { select: REFERENCE_SELECT } },
    });

    if (!funko) return undefined;

    return {
      categoryId: await catalogueReferenceId(funko.category, findApprovedCategory),
      seriesId: await catalogueReferenceId(funko.series, findApprovedSeries),
    };
  },
};
