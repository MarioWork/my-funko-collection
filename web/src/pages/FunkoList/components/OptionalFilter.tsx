import SelectFilter, { type FilterOption } from '@components/SelectFilter';
import { FALSE_VALUE } from '../funkoListUtils';
import type { FunkoFilterField, FunkoFilterUpdates } from '../hooks/useFunkoListParams';

type Props = {
  id: string;
  label: string;
  anyLabel: string;
  // The option for funkos that have none: "No series".
  noneLabel: string;
  idField: FunkoFilterField;
  hasField: FunkoFilterField;
  filters: Record<FunkoFilterField, string | undefined>;
  options: FilterOption[];
  onChange: (updates: FunkoFilterUpdates) => void;
};

const NONE = 'none';

// A field a funko may leave empty (series, collections, tags): one select with Any, None, then each value. The id
// and the has… flag are two URL params; picking one clears the other so they never disagree.
function OptionalFilter({ id, label, anyLabel, noneLabel, idField, hasField, filters, options, onChange }: Props) {
  const isNone = filters[hasField] === FALSE_VALUE;
  const value = isNone ? NONE : filters[idField];

  const change = (picked: string | undefined) => {
    const isNonePicked = picked === NONE;

    onChange({ [idField]: isNonePicked ? undefined : picked, [hasField]: isNonePicked ? FALSE_VALUE : undefined });
  };

  return (
    <SelectFilter
      id={id}
      label={label}
      anyLabel={anyLabel}
      value={value}
      options={[{ value: NONE, label: noneLabel }, ...options]}
      onChange={change}
    />
  );
}

export default OptionalFilter;
