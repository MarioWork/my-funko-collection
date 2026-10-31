// A member's submissions page. The rows are funkos, so the funkos service reads them; this module owns no table.
import { getSubmittedFunkos } from '../funkos/funkos.service.ts';
import type { ListSubmissionsQuery, SubmissionListResponse } from './submissions.type.ts';

export async function getSubmissions(userId: number, query: ListSubmissionsQuery): Promise<SubmissionListResponse> {
  return getSubmittedFunkos(userId, query);
}
