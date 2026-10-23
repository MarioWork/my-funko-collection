import { yupResolver } from '@hookform/resolvers/yup';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import type { CollectionApiModel, CollectionId, NamedApiModel } from '@app-types/models';
import IconButton from '@components/IconButton';
import ItemFormFields, { itemFormSchema, newItemFormValues, type ItemFormValues } from '@components/ItemFormFields';
import { useFormCompat } from '@hooks/useFormCompat';
import type { ItemFormHandle } from '../hooks/useItemForms';

type Props = {
  collection: CollectionApiModel;
  tags: NamedApiModel[];
  initialTagIds: number[];
  isSubmitting: boolean;
  onRegister: (collectionId: CollectionId, handle: ItemFormHandle) => () => void;
  onRemove: (collectionId: CollectionId) => void;
};

// One collection the new funko goes into, with the details of that copy: how many, condition, price, date, tags,
// notes. The same fields as editing an item later. Holds its own form; Save reads it through `onRegister`.
function CollectionItemCard({ collection, tags, initialTagIds, isSubmitting, onRegister, onRemove }: Props) {
  const { control, handleSubmit } = useFormCompat<ItemFormValues>({
    defaultValues: newItemFormValues(initialTagIds),
    resolver: yupResolver(itemFormSchema),
  });
  const headingId = `add-item-${collection.id}-heading`;

  // Lets Save check and read this card; handleSubmit shows the card's own errors when it does not pass.
  useEffect(() => {
    const read = async () => {
      let values: ItemFormValues | null = null;

      await handleSubmit((valid) => {
        values = valid;
      })();

      return values;
    };

    return onRegister(collection.id, { read });
  }, [collection.id, handleSubmit, onRegister]);

  return (
    <article aria-labelledby={headingId} className="flex flex-col gap-3 rounded-lg border bg-background p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 id={headingId} className="font-medium">
          {collection.name}
        </h3>
        <IconButton
          variant="ghost"
          size="sm"
          aria-label={`Don't add to ${collection.name}`}
          disabled={isSubmitting}
          onClick={() => onRemove(collection.id)}
        >
          <X aria-hidden="true" />
        </IconButton>
      </div>
      <ItemFormFields control={control} tags={tags} idPrefix={`add-item-${collection.id}`} />
    </article>
  );
}

export default CollectionItemCard;
