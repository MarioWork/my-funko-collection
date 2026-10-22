import { BadRequestError, NotFoundError } from '../../lib/httpErrors.ts';
import { categoriesRepository, type CategoryRow } from './categories.repository.ts';
import type {
  CategoryListResponse,
  CategoryResponse,
  CreateCategory,
  ListCategoriesQuery,
  UpdateCategory,
} from './categories.schema.ts';

const ENTITY = 'Category';

function toResponse(row: CategoryRow): CategoryResponse {
  return {
    id: row.id,
    name: row.name,
    funkoCount: row.funkoCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getCategories(query: ListCategoriesQuery): Promise<CategoryListResponse> {
  const { data, totalResultNumber } = await categoriesRepository.list(query);

  return { data: data.map(toResponse), totalResultNumber, currentPage: query.page };
}

export async function getCategory(id: number): Promise<CategoryResponse> {
  const row = await categoriesRepository.findById(id);

  if (!row) throw new NotFoundError(ENTITY, id);

  return toResponse(row);
}

export async function addCategory(data: CreateCategory): Promise<CategoryResponse> {
  const row = await categoriesRepository.create(data);

  return toResponse(row);
}

export async function updateCategory(id: number, data: UpdateCategory): Promise<CategoryResponse> {
  const row = await categoriesRepository.update(id, data);

  if (!row) throw new NotFoundError(ENTITY, id);

  return toResponse(row);
}

// For bodies that reference a category (a funko's categoryId): a missing one is the caller's input error, so 400.
export async function assertCategoryExists(id: number): Promise<void> {
  const row = await categoriesRepository.findById(id);

  if (!row) throw new BadRequestError(`Category ${id} does not exist`);
}

// Deleting a category that still has funkos fails on the FK (restrict), which the error handler answers as 409.
export async function deleteCategory(id: number): Promise<void> {
  const deleted = await categoriesRepository.delete(id);

  if (!deleted) throw new NotFoundError(ENTITY, id);
}
