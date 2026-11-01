import type { SubmitterScope } from '../../../lib/catalogueVisibility.ts';
import { isUniqueViolation } from '../../../lib/databaseErrors.ts';
import { ConflictError, NotFoundError } from '../../../lib/httpErrors.ts';
import { logger } from '../../../lib/logger.ts';
import { getFunkoSummariesOf } from '../../funkos/basics/basics.service.ts';
import type { FunkoIdentity, FunkoRow } from '../../funkos/funkos.type.ts';
import { notifySubmissionApproved, notifySubmissionRejected } from '../../notifications/notifications.service.ts';
import { submissionsRepository, type CatalogueReferences, type SubmissionRow } from '../submissions.repository.ts';
import {
  ENTITY,
  NOT_WAITING_MESSAGE,
  findWaitingSubmission,
  identityOf,
  toSingleSubmission,
  toSubmission,
} from '../submissions.service.ts';
import type { SubmissionResponse } from '../submissions.type.ts';
import { reviewRepository, type DoubleCandidateRow, type DoubleProbe } from './review.repository.ts';
import type {
  DoubleMatchField,
  ListReviewQuery,
  PossibleDouble,
  ReviewSubmissionListResponse,
} from './review.schema.ts';
import type { RejectionOutcome } from './review.type.ts';

const CATALOGUE_HAS_FUNKO_MESSAGE = 'The catalogue already has this funko. Reject this submission, or change it first';
const CATALOGUE_HAS_BARCODE_MESSAGE =
  'This barcode belongs to another funko in the catalogue. Reject this submission, or change it first';
const CATALOGUE_CLASH_MESSAGE =
  'The catalogue now has a funko, category or series that clashes with this submission. Reload and check it again';

const CATALOGUE_SCOPE: SubmitterScope = { submittedById: null };

const SAME_TEXT = new Intl.Collator('en', { sensitivity: 'accent' });

const log = logger.child({ module: 'submissions' });

// Why `candidate` may be the same funko as `probe`: the same barcode, or the same number in a category of the same
// name (any case, as the query matched it).
function doubleMatchesOf(probe: DoubleProbe, candidate: DoubleCandidateRow): DoubleMatchField[] {
  const isSameBarcode = probe.barcode !== null && probe.barcode === candidate.barcode;
  const isSameNumber = probe.number === candidate.number;
  const isSameCategory = SAME_TEXT.compare(probe.categoryName, candidate.category.name) === 0;
  const matches: DoubleMatchField[] = [];

  if (isSameBarcode) matches.push('BARCODE');
  if (isSameNumber && isSameCategory) matches.push('NUMBER_AND_CATEGORY');

  return matches;
}

function possibleDoublesOf(probe: DoubleProbe, candidates: DoubleCandidateRow[]): PossibleDouble[] {
  return candidates.flatMap((candidate) => {
    const matchedOn = candidate.id === probe.id ? [] : doubleMatchesOf(probe, candidate);

    if (matchedOn.length === 0) return [];

    return [
      {
        id: candidate.id,
        name: candidate.name,
        number: candidate.number,
        isChase: candidate.isChase,
        exclusive: candidate.exclusive,
        status: candidate.status,
        matchedOn,
      },
    ];
  });
}

// "Maybe a double", for the waiting ones only: every other approved or waiting funko that shares the barcode, or the
// number and category. One query for the whole page.
async function possibleDoublesByFunko(rows: SubmissionRow[]): Promise<Map<number, PossibleDouble[]>> {
  const probes: DoubleProbe[] = rows
    .filter((row) => row.status === 'WAITING')
    .map((row) => ({ id: row.id, barcode: row.barcode, number: row.number, categoryName: row.categoryName }));
  const candidates = await reviewRepository.findDoubleCandidates(probes);

  return new Map(probes.map((probe) => [probe.id, possibleDoublesOf(probe, candidates)]));
}

// Every member's submissions as the admins review them, waiting or done.
export async function getReviewSubmissions(query: ListReviewQuery): Promise<ReviewSubmissionListResponse> {
  const { data, totalResultNumber } = await reviewRepository.listForReview(query);
  const [summaries, doubles] = await Promise.all([getFunkoSummariesOf(data), possibleDoublesByFunko(data)]);
  const submissions = summaries.map(([row, summary]) => ({
    ...toSubmission([row, summary]),
    submittedBy: row.submittedBy,
    possibleDoubles: doubles.get(row.id) ?? [],
  }));

  return { data: submissions, totalResultNumber, currentPage: query.page };
}

// The clear refusals first: the same funko or barcode already in the catalogue (pointing at it). A clash that slips
// in between (another admin approving the same box at once) is the unique index's 23505, answered in words too.
async function assertFitsCatalogue(row: FunkoRow, categoryId: number): Promise<void> {
  const identity: FunkoIdentity = { ...identityOf(row), categoryId };
  const sameIdentity = await submissionsRepository.findIdByIdentity(identity, CATALOGUE_SCOPE);

  if (sameIdentity) throw new ConflictError(CATALOGUE_HAS_FUNKO_MESSAGE, sameIdentity.id);

  const sameBarcode = row.barcode
    ? await submissionsRepository.findIdByBarcode(row.barcode, CATALOGUE_SCOPE)
    : undefined;

  if (sameBarcode) throw new ConflictError(CATALOGUE_HAS_BARCODE_MESSAGE, sameBarcode.id);
}

async function approveOrExplain(id: number, references: CatalogueReferences): Promise<boolean> {
  try {
    return await reviewRepository.approve(id, references);
  } catch (error: unknown) {
    if (isUniqueViolation(error)) throw new ConflictError(CATALOGUE_CLASH_MESSAGE);

    throw error;
  }
}

// An admin approves a waiting submission: the funko joins the catalogue for everyone, with any waiting category and
// series of its own (one the catalogue now has by name takes their place). Refused while its identity or barcode
// clashes with the catalogue.
export async function approveSubmission(id: number): Promise<SubmissionResponse> {
  const row = await findWaitingSubmission(id);
  const references = await submissionsRepository.findCatalogueReferences(id);

  if (!references) throw new NotFoundError(ENTITY, id);

  await assertFitsCatalogue(row, references.categoryId);

  const isApproved = await approveOrExplain(id, references);

  if (!isApproved) throw new ConflictError(NOT_WAITING_MESSAGE);

  log.info({ funkoId: id }, 'submission approved');

  // An orphan submission has no sender left to tell.
  if (row.submittedById !== null)
    await notifySubmissionApproved(row.submittedById, { funkoId: id, funkoName: row.name });

  return toSingleSubmission(id);
}

// An orphan submission (its sender removed) has nobody to fix it: rejecting it deletes it.
async function deleteRejectedOrphan(id: number): Promise<RejectionOutcome> {
  const isDeleted = await reviewRepository.deleteOrphan(id);

  if (!isDeleted) throw new ConflictError(NOT_WAITING_MESSAGE);

  log.info({ funkoId: id }, 'orphan submission rejected and deleted');

  return { isDeleted: true };
}

// An admin rejects a waiting submission, saying why: it stays in its sender's collections, still private, for them
// to fix and send again, or delete. An orphan submission is deleted instead.
export async function rejectSubmission(id: number, reason: string): Promise<RejectionOutcome> {
  const current = await findWaitingSubmission(id);
  const senderId = current.submittedById;

  if (senderId === null) return deleteRejectedOrphan(id);

  const isRejected = await reviewRepository.reject(id, reason);

  if (!isRejected) throw new ConflictError(NOT_WAITING_MESSAGE);

  log.info({ funkoId: id }, 'submission rejected');

  await notifySubmissionRejected(senderId, { funkoId: id, funkoName: current.name }, reason);

  return { isDeleted: false, submission: await toSingleSubmission(id) };
}
