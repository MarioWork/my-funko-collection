import { statsRepository } from './stats.repository.ts';
import type { StatsResponse } from './stats.schema.ts';

export async function getStats(): Promise<StatsResponse> {
  const [counts, collections, byCategory] = await Promise.all([
    statsRepository.counts(),
    statsRepository.perCollection(),
    statsRepository.perCategory(),
  ]);

  return { ...counts, collections, byCategory };
}
