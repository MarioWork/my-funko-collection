import type { CategoryApiModel, CollectionApiModel, TagApiModel } from '@app-types/models';
import { ITEM_CONDITION_LABELS, ItemConditionUtil } from '@app-types/utility';
import { Field, FieldLabel } from '@components/ui/field';
import { Input } from '@components/ui/input';
import { NativeSelect, NativeSelectOption } from '@components/ui/native-select';
import type { ItemFilterField } from '@hooks/useItemListParams';
import { ItemApiSearchFields } from '@services/collectionItemService/collectionItemService';

type Props = {
  categories: CategoryApiModel[];
  tags: TagApiModel[];
  collections: CollectionApiModel[];
  hasCollectionFilter: boolean;
  filters: Record<ItemFilterField, string | undefined>;
  onChange: (field: ItemFilterField, value: string | undefined) => void;
};

type SelectFilterProps = {
  id: string;
  label: string;
  anyLabel: string;
  value: string | undefined;
  options: { value: string; label: string }[];
  onChange: (value: string | undefined) => void;
};

const ANY = '';

function SelectFilter({ id, label, anyLabel, value, options, onChange }: SelectFilterProps) {
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

function ItemFilters({ categories, tags, collections, hasCollectionFilter, filters, onChange }: Props) {
  return (
    <>
      {hasCollectionFilter ? (
        <SelectFilter
          id="item-filter-collection"
          label="Collection"
          anyLabel="Any collection"
          value={filters[ItemApiSearchFields.COLLECTION_ID]}
          options={named(collections)}
          onChange={(value) => onChange(ItemApiSearchFields.COLLECTION_ID, value)}
        />
      ) : null}
      <SelectFilter
        id="item-filter-tag"
        label="Tag"
        anyLabel="Any tag"
        value={filters[ItemApiSearchFields.TAG_ID]}
        options={named(tags)}
        onChange={(value) => onChange(ItemApiSearchFields.TAG_ID, value)}
      />
      <SelectFilter
        id="item-filter-category"
        label="Category"
        anyLabel="Any category"
        value={filters[ItemApiSearchFields.CATEGORY_ID]}
        options={named(categories)}
        onChange={(value) => onChange(ItemApiSearchFields.CATEGORY_ID, value)}
      />
      <SelectFilter
        id="item-filter-condition"
        label="Condition"
        anyLabel="Any condition"
        value={filters[ItemApiSearchFields.CONDITION]}
        options={Object.values(ItemConditionUtil).map((condition) => ({
          value: condition,
          label: ITEM_CONDITION_LABELS[condition],
        }))}
        onChange={(value) => onChange(ItemApiSearchFields.CONDITION, value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field>
          <FieldLabel htmlFor="item-filter-from">Bought from</FieldLabel>
          <Input
            id="item-filter-from"
            type="date"
            value={filters[ItemApiSearchFields.PURCHASED_FROM] ?? ''}
            onChange={(event) => onChange(ItemApiSearchFields.PURCHASED_FROM, event.target.value || undefined)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="item-filter-to">Until</FieldLabel>
          <Input
            id="item-filter-to"
            type="date"
            value={filters[ItemApiSearchFields.PURCHASED_TO] ?? ''}
            onChange={(event) => onChange(ItemApiSearchFields.PURCHASED_TO, event.target.value || undefined)}
          />
        </Field>
      </div>
    </>
  );
}

export default ItemFilters;
