import { ConflictError, NotFoundError } from '../../lib/httpErrors.ts';
import type { SubmitterScope } from '../../lib/catalogueVisibility.ts';
import type { SignedInUser } from '../auth/auth.type.ts';
import type { SubmissionStatus } from '../submissions/submissions.type.ts';
import { seriesRepository, type SeriesRow } from './series.repository.ts';
import type {
  CreateSeries,
  ListSeriesQuery,
  SeriesListResponse,
  SeriesResponse,
  UpdateSeries,
} from './series.schema.ts';

const ENTITY = 'Series';

type SeriesAccess = { status: SubmissionStatus; submittedById: number | null };

function toResponse(row: SeriesRow): SeriesResponse {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    funkoCount: row.funkoCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// An admin sees every series; anyone else the approved ones and the ones they typed in themselves.
function canSee(user: SignedInUser, series: SeriesAccess): boolean {
  const isApproved = series.status === 'APPROVED';
  const isOwn = series.submittedById === user.userId;

  return user.isAdmin || isApproved || isOwn;
}

// A member's new series waits with their submission; an admin's joins the catalogue at once.
function scopeOf(user: SignedInUser): SubmitterScope {
  return { submittedById: user.isAdmin ? null : user.userId };
}

// A member typing a name the catalogue already has gets a 409 pointing at it, so the form can pick that one. An
// admin's duplicate, or a member's second waiting one of the same name, the database refuses (the partial unique
// indexes) with a plain 409.
async function assertNotInCatalogueForMember(name: string, scope: SubmitterScope): Promise<void> {
  const isAdminScope = scope.submittedById === null;

  if (isAdminScope) return;

  const inCatalogue = await seriesRepository.findIdByName(name, { submittedById: null });

  if (inCatalogue) throw new ConflictError('This series is already in the catalogue', inCatalogue.id);
}

export async function getSeriesList(userId: number, query: ListSeriesQuery): Promise<SeriesListResponse> {
  const { data, totalResultNumber } = await seriesRepository.list(userId, query);

  return { data: data.map(toResponse), totalResultNumber, currentPage: query.page };
}

export async function getSeries(user: SignedInUser, id: number): Promise<SeriesResponse> {
  const row = await seriesRepository.findById(user.userId, id);

  if (!row || !canSee(user, row)) throw new NotFoundError(ENTITY, id);

  return toResponse(row);
}

export async function addSeries(user: SignedInUser, data: CreateSeries): Promise<SeriesResponse> {
  const scope = scopeOf(user);
  const status: SubmissionStatus = scope.submittedById === null ? 'APPROVED' : 'WAITING';

  await assertNotInCatalogueForMember(data.name, scope);

  const row = await seriesRepository.create(user.userId, { ...data, status, submittedById: scope.submittedById });

  return toResponse(row);
}

export async function updateSeries(user: SignedInUser, id: number, data: UpdateSeries): Promise<SeriesResponse> {
  const row = await seriesRepository.update(user.userId, id, data);

  if (!row) throw new NotFoundError(ENTITY, id);

  return toResponse(row);
}

// Unlike a category, a series is optional on a funko: the FK sets their seriesId to null, so this never answers 409.
export async function deleteSeries(id: number): Promise<void> {
  const deleted = await seriesRepository.delete(id);

  if (!deleted) throw new NotFoundError(ENTITY, id);
}

// For funkos: whether a funko sent in by `submitterId` may have this series. Every funko may use an approved
// one; a waiting one only its own sender's waiting submissions (null: an approved funko, so approved ones only).
export async function isUsableSeries(id: number, submitterId: number | null): Promise<boolean> {
  const access = await seriesRepository.findAccess(id);

  if (!access) return false;

  const isApproved = access.status === 'APPROVED';
  const isSendersWaiting = access.status === 'WAITING' && submitterId !== null && access.submittedById === submitterId;

  return isApproved || isSendersWaiting;
}
