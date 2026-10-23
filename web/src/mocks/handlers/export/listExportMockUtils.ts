// The rules of the API's GET /export/<list>.{csv,json,xlsx} over the mock store: the list's own columns, and the
// funkos of every entry when includeFunkos is set.
import { ExportFunkosScopeUtil, ExportListKindUtil } from '@app-types/utility';
import { mockStore } from '@mocks/mockStore';
import { linesOfEntry, type Cell, type ExportLine } from './funkosExportMockUtils';

const CENTS_PER_UNIT = 100;
const FILE_PREFIX = 'my-funko-collection';
const WITH_FUNKOS_SUFFIX = '-with-funkos';
const INCLUDE_FUNKOS_PARAM = 'includeFunkos';

export type ListEntry = { id: number; name: string; summary: Record<string, Cell> };

type ListReader = {
  scope: ExportFunkosScopeUtil;
  // The CSV header, in the order the summary's values are written.
  columns: string[];
  entries: () => ListEntry[];
};

function byName(first: ListEntry, second: ListEntry): number {
  return first.name.localeCompare(second.name);
}

const LIST_READERS: Record<ExportListKindUtil, ListReader> = {
  [ExportListKindUtil.CATEGORIES]: {
    scope: ExportFunkosScopeUtil.CATEGORY,
    columns: ['id', 'name', 'funko_count'],
    entries: () =>
      mockStore.categories
        .map(({ id, name }) => {
          const funkoCount = mockStore.funkos.filter((funko) => funko.categoryId === id).length;

          return { id, name, summary: { id, name, funkoCount } };
        })
        .sort(byName),
  },
  [ExportListKindUtil.SERIES]: {
    scope: ExportFunkosScopeUtil.SERIES,
    columns: ['id', 'name', 'funko_count'],
    entries: () =>
      mockStore.series
        .map(({ id, name }) => {
          const funkoCount = mockStore.funkos.filter((funko) => funko.seriesId === id).length;

          return { id, name, summary: { id, name, funkoCount } };
        })
        .sort(byName),
  },
  [ExportListKindUtil.COLLECTIONS]: {
    scope: ExportFunkosScopeUtil.COLLECTION,
    columns: ['id', 'name', 'is_default', 'funko_count', 'pieces', 'total_spent', 'notes'],
    entries: () =>
      mockStore.collections
        .map(({ id, name, notes, isDefault }) => {
          const items = mockStore.items.filter((item) => item.collectionId === id);
          const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
          const spentCents = items.reduce((sum, item) => sum + (item.purchasePriceCents ?? 0) * item.quantity, 0);
          const summary = {
            id,
            name,
            isDefault,
            itemCount: items.length,
            totalQuantity,
            totalSpent: spentCents / CENTS_PER_UNIT,
            notes,
          };

          return { id, name, summary };
        })
        .sort(byName),
  },
  [ExportListKindUtil.TAGS]: {
    scope: ExportFunkosScopeUtil.TAG,
    columns: ['id', 'name', 'item_count', 'notes'],
    entries: () =>
      mockStore.tags
        .map(({ id, name, notes }) => {
          const itemCount = mockStore.items.filter((item) => item.tagIds.includes(id)).length;

          return { id, name, summary: { id, name, itemCount, notes } };
        })
        .sort(byName),
  },
};

export type ListExport = {
  fileBase: string;
  columns: string[];
  entries: ListEntry[];
  includeFunkos: boolean;
  linesOf: (entry: ListEntry) => ExportLine[];
};

export function readListExport(kind: ExportListKindUtil, requestUrl: string): ListExport {
  const reader = LIST_READERS[kind];
  const includeFunkos = new URL(requestUrl).searchParams.get(INCLUDE_FUNKOS_PARAM) === 'true';

  return {
    fileBase: `${FILE_PREFIX}-${kind}${includeFunkos ? WITH_FUNKOS_SUFFIX : ''}`,
    columns: reader.columns,
    entries: reader.entries(),
    includeFunkos,
    linesOf: (entry) => linesOfEntry(reader.scope, entry.id),
  };
}

// Every line of every entry, each once: an item carrying two tags would otherwise show up under both.
export function uniqueLines(listExport: ListExport): ExportLine[] {
  const seen = new Set<string>();

  return listExport.entries.flatMap(listExport.linesOf).filter(({ funko, item }) => {
    const key = item ? `item-${item.id}` : `funko-${funko.id}`;
    const isNew = !seen.has(key);

    seen.add(key);

    return isNew;
  });
}
