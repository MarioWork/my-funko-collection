import { Controller, type Control } from 'react-hook-form';
import type { NamedApiModel } from '@app-types/models';
import { TAG_ROUTES_PATHS } from '@application/routes/routesUtils';
import TagPicker from '@components/TagPicker';
import { Field, FieldLabel } from '@components/ui/field';
import type { ItemFormValues } from '../itemFormUtils';

type Props = {
  control: Control<ItemFormValues>;
  tags: NamedApiModel[];
  id: string;
};

function ItemTagsField({ control, tags, id }: Props) {
  return (
    <Controller
      control={control}
      name="tagIds"
      render={({ field: { value, onChange } }) => (
        <Field>
          <FieldLabel htmlFor={id}>Tags</FieldLabel>
          <TagPicker
            createActionPath={TAG_ROUTES_PATHS.BASE}
            id={id}
            tags={tags}
            value={tags.filter((tag) => value.includes(tag.id))}
            onChange={(next) => onChange(next.map((tag) => tag.id))}
          />
        </Field>
      )}
    />
  );
}

export default ItemTagsField;
