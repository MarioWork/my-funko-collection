import { BadRequestError, NotFoundError } from '../../lib/httpErrors.ts';
import { seriesRepository, type SeriesRow } from './series.repository.ts';
import type {
  CreateSeries,
  ListSeriesQuery,
  SeriesListResponse,
  SeriesResponse,
  UpdateSeries,
} from './series.schema.ts';

const ENTITY = 'Series';

function toResponse(row: SeriesRow): SeriesResponse {
  return {
    id: row.id,
    name: row.name,
    funkoCount: row.funkoCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getSeriesList(query: ListSeriesQuery): Promise<SeriesListResponse> {
  const { data, totalResultNumber } = await seriesRepository.list(query);

  return { data: data.map(toResponse), totalResultNumber, currentPage: query.page };
}

export async function getSeries(id: number): Promise<SeriesResponse> {
  const row = await seriesRepository.findById(id);

  if (!row) throw new NotFoundError(ENTITY, id);

  return toResponse(row);
}

export async function addSeries(data: CreateSeries): Promise<SeriesResponse> {
  const row = await seriesRepository.create(data);

  return toResponse(row);
}

export async function updateSeries(id: number, data: UpdateSeries): Promise<SeriesResponse> {
  const row = await seriesRepository.update(id, data);

  if (!row) throw new NotFoundError(ENTITY, id);

  return toResponse(row);
}

// For bodies that reference a series (a funko's seriesId): a missing one is the caller's input error, so 400.
export async function assertSeriesExists(id: number): Promise<void> {
  const row = await seriesRepository.findById(id);

  if (!row) throw new BadRequestError(`Series ${id} does not exist`);
}

// Unlike a category, a series is optional on a funko: the FK sets their seriesId to null, so this never answers 409.
export async function deleteSeries(id: number): Promise<void> {
  const deleted = await seriesRepository.delete(id);

  if (!deleted) throw new NotFoundError(ENTITY, id);
}
