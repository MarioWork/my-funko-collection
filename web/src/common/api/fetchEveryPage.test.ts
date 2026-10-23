import type { PaginationUtil } from '@app-types/utility';
import { fetchEveryPage } from './fetchEveryPage';

const TOTAL = 230;
const rows = Array.from({ length: TOTAL }, (_, index) => index + 1);

function fakePage({ page, size }: PaginationUtil) {
  const start = (Number(page) - 1) * Number(size);

  return Promise.resolve({
    data: rows.slice(start, start + Number(size)),
    totalResultNumber: TOTAL,
    currentPage: Number(page),
  });
}

describe('fetchEveryPage', () => {
  it('returns every row across the pages, in order', async () => {
    const asked: string[] = [];

    const result = await fetchEveryPage((pagination) => {
      asked.push(pagination.page);

      return fakePage(pagination);
    });

    expect(result).toEqual(rows);
    expect(asked).toEqual(['1', '2', '3']);
  });

  it('asks once when everything fits on the first page', async () => {
    let calls = 0;

    const result = await fetchEveryPage(() => {
      calls += 1;

      return Promise.resolve({ data: [1, 2], totalResultNumber: 2, currentPage: 1 });
    });

    expect(result).toEqual([1, 2]);
    expect(calls).toBe(1);
  });
});
