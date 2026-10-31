import { statsRepository } from './stats.repository.ts';
import type { StatsResponse } from './stats.schema.ts';

// The signed-in user's totals: their collections, and the funkos (with their categories and images) in them.
export async function getStats(userId: number): Promise<StatsResponse> {
  const [counts, collections, byCategory] = await Promise.all([
    statsRepository.counts(userId),
    statsRepository.perCollection(userId),
    statsRepository.perCategory(userId),
  ]);

  return { ...counts, collections, byCategory };
}
