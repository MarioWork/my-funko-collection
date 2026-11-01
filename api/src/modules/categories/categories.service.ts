import { isRestrictViolation } from '../../lib/databaseErrors.ts';
import { ConflictError, NotFoundError } from '../../lib/httpErrors.ts';
import type { SubmitterScope } from '../../lib/catalogueVisibility.ts';
import type { SignedInUser } from '../auth/auth.type.ts';
import type { SubmissionStatus } from '../submissions/submissions.type.ts';
import { categoriesRepository, type CategoryRow } from './categories.repository.ts';
import type {
  CategoryListResponse,
  CategoryResponse,
  CreateCategory,
  ListCategoriesQuery,
  UpdateCategory,
} from './categories.schema.ts';

const ENTITY = 'Category';
const IN_USE_MESSAGE = 'Funkos still use this category. Move them to another category first';

type CategoryAccess = { status: SubmissionStatus; submittedById: number | null };

function toResponse(row: CategoryRow): CategoryResponse {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    funkoCount: row.funkoCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// An admin sees every category; anyone else the approved ones and the ones they typed in themselves.
function canSee(user: SignedInUser, category: CategoryAccess): boolean {
  const isApproved = category.status === 'APPROVED';
  const isOwn = category.submittedById === user.userId;

  return user.isAdmin || isApproved || isOwn;
}

// A member's new category waits with their submission; an admin's joins the catalogue at once.
function scopeOf(user: SignedInUser): SubmitterScope {
  return { submittedById: user.isAdmin ? null : user.userId };
}

// A member typing a name the catalogue already has gets a 409 pointing at it, so the form can pick that one. An
// admin's duplicate, or a member's second waiting one of the same name, the database refuses (the partial unique
// indexes) with a plain 409.
async function assertNotInCatalogueForMember(name: string, scope: SubmitterScope): Promise<void> {
  const isAdminScope = scope.submittedById === null;

  if (isAdminScope) return;

  const inCatalogue = await categoriesRepository.findIdByName(name, { submittedById: null });

  if (inCatalogue) throw new ConflictError('This category is already in the catalogue', inCatalogue.id);
}

export async function getCategories(userId: number, query: ListCategoriesQuery): Promise<CategoryListResponse> {
  const { data, totalResultNumber } = await categoriesRepository.list(userId, query);

  return { data: data.map(toResponse), totalResultNumber, currentPage: query.page };
}

export async function getCategory(user: SignedInUser, id: number): Promise<CategoryResponse> {
  const row = await categoriesRepository.findById(user.userId, id);

  if (!row || !canSee(user, row)) throw new NotFoundError(ENTITY, id);

  return toResponse(row);
}

export async function addCategory(user: SignedInUser, data: CreateCategory): Promise<CategoryResponse> {
  const scope = scopeOf(user);
  const status: SubmissionStatus = scope.submittedById === null ? 'APPROVED' : 'WAITING';

  await assertNotInCatalogueForMember(data.name, scope);

  const row = await categoriesRepository.create(user.userId, { ...data, status, submittedById: scope.submittedById });

  return toResponse(row);
}

export async function updateCategory(user: SignedInUser, id: number, data: UpdateCategory): Promise<CategoryResponse> {
  const row = await categoriesRepository.update(user.userId, id, data);

  if (!row) throw new NotFoundError(ENTITY, id);

  return toResponse(row);
}

// Every funko has a category, so one that funkos use (any funko: approved, waiting, rejected or merged) is refused
// by the database (`onDelete: Restrict`), answered here in words.
export async function deleteCategory(id: number): Promise<void> {
  const deleted = await deleteOrExplain(id);

  if (!deleted) throw new NotFoundError(ENTITY, id);
}

async function deleteOrExplain(id: number): Promise<{ id: number } | undefined> {
  try {
    return await categoriesRepository.delete(id);
  } catch (error: unknown) {
    if (isRestrictViolation(error)) throw new ConflictError(IN_USE_MESSAGE);

    throw error;
  }
}

// For funkos: whether a funko sent in by `submitterId` may sit in this category. Every funko may use an approved
// one; a waiting one only its own sender's waiting submissions (null: an approved funko, so approved ones only).
export async function isUsableCategory(id: number, submitterId: number | null): Promise<boolean> {
  const access = await categoriesRepository.findAccess(id);

  if (!access) return false;

  const isApproved = access.status === 'APPROVED';
  const isSendersWaiting = access.status === 'WAITING' && submitterId !== null && access.submittedById === submitterId;

  return isApproved || isSendersWaiting;
}
