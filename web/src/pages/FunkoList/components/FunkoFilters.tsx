import type { CategoryApiModel, CollectionApiModel, TagApiModel } from '@app-types/models';
import { FUNKO_TYPE_LABELS, FunkoTypeUtil } from '@app-types/utility';
import { Field, FieldLabel } from '@components/ui/field';
import { NativeSelect, NativeSelectOption } from '@components/ui/native-select';
import { FunkoApiSearchFields } from '@services/funkoService/funkoService';
import type { FunkoFilterField } from '../hooks/useFunkoListParams';

type Props = {
  categories: CategoryApiModel[];
  collections: CollectionApiModel[];
  tags: TagApiModel[];
  filters: Record<FunkoFilterField, string | undefined>;
  onChange: (field: FunkoFilterField, value: string | undefined) => void;
};

type SelectFilterProps = {
  id: string;
  label: string;
  value: string | undefined;
  anyLabel: string;
  options: { value: string; label: string }[];
  onChange: (value: string | undefined) => void;
};

const ANY = '';

// Native selects: one tap on phone opens the OS picker, which beats a custom list for 5–30 options.
function SelectFilter({ id, label, value, anyLabel, options, onChange }: SelectFilterProps) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <NativeSelect id={id} value={value ?? ANY} onChange={(event) => onChange(event.target.value || undefined)}>
        <NativeSelectOption value={ANY}>{anyLabel}</NativeSelectOption>
        {options.map((option) => (
          <NativeSelectOption key={option.value} value={option.value}>
            {option.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </Field>
  );
}

const named = (rows: { id: number; name: string }[]) => rows.map((row) => ({ value: String(row.id), label: row.name }));

const YES_NO_OPTIONS = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

function FunkoFilters({ categories, collections, tags, filters, onChange }: Props) {
  return (
    <>
      <SelectFilter
        id="filter-category"
        label="Category"
        anyLabel="Any category"
        value={filters[FunkoApiSearchFields.CATEGORY_ID]}
        options={named(categories)}
        onChange={(value) => onChange(FunkoApiSearchFields.CATEGORY_ID, value)}
      />
      <SelectFilter
        id="filter-type"
        label="Type"
        anyLabel="Any type"
        value={filters[FunkoApiSearchFields.TYPE]}
        options={Object.values(FunkoTypeUtil).map((type) => ({ value: type, label: FUNKO_TYPE_LABELS[type] }))}
        onChange={(value) => onChange(FunkoApiSearchFields.TYPE, value)}
      />
      <SelectFilter
        id="filter-chase"
        label="Chase"
        anyLabel="Chase or not"
        value={filters[FunkoApiSearchFields.IS_CHASE]}
        options={YES_NO_OPTIONS}
        onChange={(value) => onChange(FunkoApiSearchFields.IS_CHASE, value)}
      />
      <SelectFilter
        id="filter-collection"
        label="In collection"
        anyLabel="Any"
        value={filters[FunkoApiSearchFields.COLLECTION_ID]}
        options={named(collections)}
        onChange={(value) => onChange(FunkoApiSearchFields.COLLECTION_ID, value)}
      />
      <SelectFilter
        id="filter-not-in-collection"
        label="Not in collection"
        anyLabel="Any"
        value={filters[FunkoApiSearchFields.NOT_IN_COLLECTION_ID]}
        options={named(collections)}
        onChange={(value) => onChange(FunkoApiSearchFields.NOT_IN_COLLECTION_ID, value)}
      />
      <SelectFilter
        id="filter-tag"
        label="Tag"
        anyLabel="Any tag"
        value={filters[FunkoApiSearchFields.TAG_ID]}
        options={named(tags)}
        onChange={(value) => onChange(FunkoApiSearchFields.TAG_ID, value)}
      />
      <SelectFilter
        id="filter-has-images"
        label="Photos"
        anyLabel="With or without"
        value={filters[FunkoApiSearchFields.HAS_IMAGES]}
        options={[
          { value: 'true', label: 'With photos' },
          { value: 'false', label: 'Without photos' },
        ]}
        onChange={(value) => onChange(FunkoApiSearchFields.HAS_IMAGES, value)}
      />
    </>
  );
}

export default FunkoFilters;
