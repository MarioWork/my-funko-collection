// What the submissions jobs share: a submission as the API answers it, and the guard that it is still waiting.
import { ConflictError, NotFoundError } from '../../lib/httpErrors.ts';
import { getFunkoSummariesOf } from '../funkos/basics/basics.service.ts';
import type { FunkoIdentity, FunkoRow, FunkoSummary } from '../funkos/funkos.type.ts';
import { submissionsRepository, type SubmissionRow } from './submissions.repository.ts';
import type { SubmissionResponse } from './submissions.type.ts';

export const ENTITY = 'Funko';
export const NOT_WAITING_MESSAGE = 'Only a waiting submission can be approved, rejected or merged';

export function toSubmission([row, summary]: [SubmissionRow, FunkoSummary]): SubmissionResponse {
  return {
    ...summary,
    status: row.status,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    rejectionReason: row.rejectionReason,
    changedByAdminAt: row.changedByAdminAt?.toISOString() ?? null,
    mergedInto: row.mergedInto,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// A page of submissions, each with its primary image: one image query for the whole page.
export async function toSubmissions(rows: SubmissionRow[]): Promise<SubmissionResponse[]> {
  const summaries = await getFunkoSummariesOf(rows);

  return summaries.map(toSubmission);
}

export async function toSingleSubmission(id: number): Promise<SubmissionResponse> {
  const row = await submissionsRepository.findSubmission(id);

  if (!row) throw new NotFoundError(ENTITY, id);

  const [submission] = await toSubmissions([row]);

  if (!submission) throw new NotFoundError(ENTITY, id);

  return submission;
}

// Approving, rejecting and merging take a waiting submission: one that is not there is 404, one already reviewed 409.
export async function findWaitingSubmission(id: number): Promise<FunkoRow> {
  const row = await submissionsRepository.findById(id);

  if (!row) throw new NotFoundError(ENTITY, id);

  if (row.status !== 'WAITING') throw new ConflictError(NOT_WAITING_MESSAGE);

  return row;
}

// The columns the duplicate guard compares (funkos_identity_uidx), read off a funko.
export function identityOf(row: FunkoRow): FunkoIdentity {
  return {
    categoryId: row.categoryId,
    number: row.number,
    name: row.name,
    isChase: row.isChase,
    exclusive: row.exclusive,
  };
}
