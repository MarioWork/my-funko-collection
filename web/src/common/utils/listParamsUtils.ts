import { SortingDirectionUtil } from '@app-types/utility';

const DIRECTIONS = new Set<string>(Object.values(SortingDirectionUtil));

// How a yes/no filter is written in the URL and sent to the API (`?hasImages=true`).
export const TRUE_VALUE = 'true';
export const FALSE_VALUE = 'false';

// Every search field the URL sets, under its own name. An empty value is left out so it never reaches the wire.
export function readSearchFields<Field extends string>(
  searchParams: URLSearchParams,
  fieldNames: readonly Field[],
): Partial<Record<Field, string>> {
  const fields: Partial<Record<Field, string>> = {};

  for (const field of fieldNames) {
    const value = searchParams.get(field);

    if (value) fields[field] = value;
  }

  return fields;
}

// The URL's sort field when it is one the list knows, otherwise undefined (an old or hand-edited link).
export function readSortField<Field extends string>(
  sortParam: string,
  sortFields: readonly Field[],
): Field | undefined {
  const isKnownField = (sortFields as readonly string[]).includes(sortParam);

  if (!isKnownField) return undefined;

  return sortParam as Field;
}

// The URL's sort direction when it is a real one, otherwise undefined.
export function readSortDirection(directionParam: string): SortingDirectionUtil | undefined {
  if (!DIRECTIONS.has(directionParam)) return undefined;

  return directionParam as SortingDirectionUtil;
}
