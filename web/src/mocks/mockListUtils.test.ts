import { ApiUrlParamsUtil, SortingDirectionUtil } from '@app-types/utility';
import { anyOf, paginateMockList } from './mockListUtils';

type Row = {
  name: string;
  country: string;
  size: number;
  isBlocked: boolean;
  issuedAt: string;
  tags: { label: string }[];
};

const row = (overrides: Partial<Row> = {}): Row => ({
  name: 'Alpha',
  country: 'PT',
  size: 1,
  isBlocked: false,
  issuedAt: '2026-03-01T10:00:00.000Z',
  tags: [{ label: 'red' }],
  ...overrides,
});

const requestWith = (params: Record<string, string> = {}) =>
  new Request(`https://api.test/things?${new URLSearchParams(params).toString()}`);

describe('paginateMockList', () => {
  it('returns every row when the request carries no params', () => {
    const items = [row({ name: 'Alpha' }), row({ name: 'Beta' })];

    const response = paginateMockList(requestWith(), items);

    expect(response.data).toEqual(items);
    expect(response.totalResultNumber).toBe(2);
    expect(response.currentPage).toBe(1);
  });

  it('narrows text fields loosely and case-insensitively', () => {
    const items = [row({ name: 'Alpha' }), row({ name: 'Beta' }), row({ name: 'Gamma' })];

    const response = paginateMockList(requestWith({ name: 'ET' }), items, {
      filters: { name: (item) => item.name },
    });

    expect(response.data.map((item) => item.name)).toEqual(['Beta']);
  });

  it('narrows non-text fields on the whole value, so PT does not answer for PTX', () => {
    const items = [row({ size: 1 }), row({ size: 12 })];

    const response = paginateMockList(requestWith({ size: '1' }), items, {
      filters: { size: (item) => item.size },
    });

    expect(response.data.map((item) => item.size)).toEqual([1]);
  });

  it('narrows booleans on their string form', () => {
    const items = [row({ name: 'Open', isBlocked: false }), row({ name: 'Shut', isBlocked: true })];

    const response = paginateMockList(requestWith({ isBlocked: 'true' }), items, {
      filters: { isBlocked: (item) => item.isBlocked },
    });

    expect(response.data.map((item) => item.name)).toEqual(['Shut']);
  });

  it('ignores a filter the request does not carry', () => {
    const items = [row({ name: 'Alpha' }), row({ name: 'Beta' })];

    const response = paginateMockList(requestWith(), items, {
      filters: { name: (item) => item.name },
    });

    expect(response.data).toHaveLength(2);
  });

  it('applies several filters together', () => {
    const items = [
      row({ name: 'Alpha', country: 'PT' }),
      row({ name: 'Alpha', country: 'ES' }),
      row({ name: 'Beta', country: 'PT' }),
    ];

    const response = paginateMockList(requestWith({ name: 'Alpha', country: 'PT' }), items, {
      filters: { name: (item) => item.name, country: (item) => item.country },
    });

    expect(response.data).toHaveLength(1);
    expect(response.data[0]).toMatchObject({ name: 'Alpha', country: 'PT' });
  });

  it('keeps only the rows inside a range, on both ends', () => {
    const items = [
      row({ name: 'Early', issuedAt: '2026-01-01T00:00:00.000Z' }),
      row({ name: 'Middle', issuedAt: '2026-03-01T00:00:00.000Z' }),
      row({ name: 'Late', issuedAt: '2026-06-01T00:00:00.000Z' }),
    ];
    const ranges = [{ from: 'from', to: 'to', read: (item: Row) => item.issuedAt }];

    const response = paginateMockList(
      requestWith({ from: '2026-02-01T00:00:00.000Z', to: '2026-04-01T00:00:00.000Z' }),
      items,
      { ranges },
    );

    expect(response.data.map((item) => item.name)).toEqual(['Middle']);
  });

  it('leaves an open end of a range unbounded', () => {
    const items = [
      row({ name: 'Early', issuedAt: '2026-01-01T00:00:00.000Z' }),
      row({ name: 'Late', issuedAt: '2026-06-01T00:00:00.000Z' }),
    ];
    const ranges = [{ from: 'from', to: 'to', read: (item: Row) => item.issuedAt }];

    const response = paginateMockList(requestWith({ from: '2026-02-01T00:00:00.000Z' }), items, { ranges });

    expect(response.data.map((item) => item.name)).toEqual(['Late']);
  });

  it('orders by the requested sorting field', () => {
    const items = [row({ name: 'Gamma' }), row({ name: 'Alpha' }), row({ name: 'Beta' })];

    const response = paginateMockList(requestWith({ [ApiUrlParamsUtil.sorting_fields]: 'name' }), items, {
      sorts: { name: (item) => item.name },
    });

    expect(response.data.map((item) => item.name)).toEqual(['Alpha', 'Beta', 'Gamma']);
  });

  it('orders numbers by value rather than as text', () => {
    const items = [row({ size: 10 }), row({ size: 2 }), row({ size: 1 })];

    const response = paginateMockList(requestWith({ [ApiUrlParamsUtil.sorting_fields]: 'size' }), items, {
      sorts: { size: (item) => item.size },
    });

    expect(response.data.map((item) => item.size)).toEqual([1, 2, 10]);
  });

  it('reverses the order when the direction is descending', () => {
    const items = [row({ name: 'Alpha' }), row({ name: 'Beta' })];

    const response = paginateMockList(
      requestWith({
        [ApiUrlParamsUtil.sorting_fields]: 'name',
        [ApiUrlParamsUtil.sortingDirection]: SortingDirectionUtil.DESC,
      }),
      items,
      { sorts: { name: (item) => item.name } },
    );

    expect(response.data.map((item) => item.name)).toEqual(['Beta', 'Alpha']);
  });

  it('breaks a tie on the first field with the second one', () => {
    const items = [
      row({ country: 'PT', name: 'Beta' }),
      row({ country: 'ES', name: 'Zeta' }),
      row({ country: 'PT', name: 'Alpha' }),
    ];

    const response = paginateMockList(requestWith({ [ApiUrlParamsUtil.sorting_fields]: 'country,name' }), items, {
      sorts: { country: (item) => item.country, name: (item) => item.name },
    });

    expect(response.data.map((item) => `${item.country}-${item.name}`)).toEqual(['ES-Zeta', 'PT-Alpha', 'PT-Beta']);
  });

  it('leaves the order alone for a sorting field the handler does not name', () => {
    const items = [row({ name: 'Gamma' }), row({ name: 'Alpha' })];

    const response = paginateMockList(requestWith({ [ApiUrlParamsUtil.sorting_fields]: 'unknown' }), items, {
      sorts: { name: (item) => item.name },
    });

    expect(response.data.map((item) => item.name)).toEqual(['Gamma', 'Alpha']);
  });

  it('does not order the caller own array', () => {
    const items = [row({ name: 'Gamma' }), row({ name: 'Alpha' })];

    paginateMockList(requestWith({ [ApiUrlParamsUtil.sorting_fields]: 'name' }), items, {
      sorts: { name: (item) => item.name },
    });

    expect(items.map((item) => item.name)).toEqual(['Gamma', 'Alpha']);
  });

  it('serves the requested page at the requested size', () => {
    const items = Array.from({ length: 7 }, (_, index) => row({ name: `Row ${index}` }));

    const response = paginateMockList(
      requestWith({ [ApiUrlParamsUtil.page]: '2', [ApiUrlParamsUtil.pageSize]: '3' }),
      items,
    );

    expect(response.data.map((item) => item.name)).toEqual(['Row 3', 'Row 4', 'Row 5']);
    expect(response.currentPage).toBe(2);
  });

  it('counts every matching row, not just the page it serves', () => {
    const items = Array.from({ length: 7 }, (_, index) => row({ name: `Row ${index}` }));

    const response = paginateMockList(
      requestWith({ [ApiUrlParamsUtil.page]: '2', [ApiUrlParamsUtil.pageSize]: '3' }),
      items,
    );

    expect(response.totalResultNumber).toBe(7);
  });

  it('pages the rows left after filtering, not the ones it started with', () => {
    const items = [
      row({ name: 'Keep 1', country: 'PT' }),
      row({ name: 'Drop', country: 'ES' }),
      row({ name: 'Keep 2', country: 'PT' }),
    ];

    const response = paginateMockList(
      requestWith({ country: 'PT', [ApiUrlParamsUtil.page]: '1', [ApiUrlParamsUtil.pageSize]: '10' }),
      items,
      { filters: { country: (item) => item.country } },
    );

    expect(response.data.map((item) => item.name)).toEqual(['Keep 1', 'Keep 2']);
    expect(response.totalResultNumber).toBe(2);
  });

  it('serves the first ten rows when the request carries no paging', () => {
    const items = Array.from({ length: 12 }, (_, index) => row({ name: `Row ${index}` }));

    const response = paginateMockList(requestWith(), items);

    expect(response.data).toHaveLength(10);
    expect(response.currentPage).toBe(1);
  });

  it('serves an empty page past the end of the list', () => {
    const items = [row(), row()];

    const response = paginateMockList(
      requestWith({ [ApiUrlParamsUtil.page]: '5', [ApiUrlParamsUtil.pageSize]: '10' }),
      items,
    );

    expect(response.data).toEqual([]);
    expect(response.totalResultNumber).toBe(2);
  });
});

describe('anyOf', () => {
  it('reads a row many values as one string', () => {
    expect(anyOf([{ label: 'red' }, { label: 'blue' }], (tag) => tag.label)).toBe('red blue');
  });

  it('lets a row answer a filter when any one of its values matches', () => {
    const items = [
      row({ name: 'Warm', tags: [{ label: 'red' }, { label: 'orange' }] }),
      row({ name: 'Cool', tags: [{ label: 'blue' }, { label: 'green' }] }),
    ];

    const response = paginateMockList(requestWith({ tags: 'green' }), items, {
      filters: { tags: (item) => anyOf(item.tags, (tag) => tag.label) },
    });

    expect(response.data.map((item) => item.name)).toEqual(['Cool']);
  });

  it('reads an empty list as an empty string', () => {
    expect(anyOf([], (tag: { label: string }) => tag.label)).toBe('');
  });
});
