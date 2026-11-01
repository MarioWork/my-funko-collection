import { toSubmissions } from '../submissions.service.ts';
import { sentRepository } from './sent.repository.ts';
import type { ListSubmissionsQuery, SubmissionListResponse } from './sent.schema.ts';

// What `userId` sent in, whatever became of it.
export async function getSubmissions(userId: number, query: ListSubmissionsQuery): Promise<SubmissionListResponse> {
  const { data, totalResultNumber } = await sentRepository.listSubmissions(userId, query);

  return { data: await toSubmissions(data), totalResultNumber, currentPage: query.page };
}
