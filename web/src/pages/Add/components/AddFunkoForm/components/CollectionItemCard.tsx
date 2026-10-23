import { yupResolver } from '@hookform/resolvers/yup';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useWatch } from 'react-hook-form';
import type { CollectionApiModel, CollectionId, NamedApiModel } from '@app-types/models';
import IconButton from '@components/IconButton';
import ItemFormFields, { itemFormSchema, newItemFormValues, type ItemFormValues } from '@components/ItemFormFields';
import { useFormCompat } from '@hooks/useFormCompat';
import type { ItemFormHandle } from '../hooks/useItemForms';
import { itemSummary } from '../itemSummaryUtils';
import CollectionCardToggle from './CollectionCardToggle';
import FoldPanel from './FoldPanel';

type Props = {
  collection: CollectionApiModel;
  tags: NamedApiModel[];
  initialTagIds: number[];
  isSubmitting: boolean;
  // Closed for the collections already picked when the page opened (bar the first); a newly picked one opens.
  isInitiallyOpen: boolean;
  onRegister: (collectionId: CollectionId, handle: ItemFormHandle) => () => void;
  onRemove: (collectionId: CollectionId) => void;
};

const ID_PREFIX = 'add-item';

// One collection the new funko goes into, with the details of that copy: how many, condition, price, date, tags,
// notes. The same fields as editing an item later. Holds its own form; Save reads it through `onRegister`.
// Folds like an accordion (the name is the toggle); folded fields stay mounted, so nothing typed is lost.
function CollectionItemCard({
  collection,
  tags,
  initialTagIds,
  isSubmitting,
  isInitiallyOpen,
  onRegister,
  onRemove,
}: Props) {
  const { control, handleSubmit } = useFormCompat<ItemFormValues>({
    defaultValues: newItemFormValues(initialTagIds),
    resolver: yupResolver(itemFormSchema),
  });
  const values = useWatch({ control });
  const [isOpen, setIsOpen] = useState(isInitiallyOpen);
  const idPrefix = `${ID_PREFIX}-${collection.id}`;
  const headingId = `${idPrefix}-heading`;
  const panelId = `${idPrefix}-panel`;

  // Lets Save check and read this card; handleSubmit shows the card's own errors when it does not pass.
  useEffect(() => {
    const read = async () => {
      let values: ItemFormValues | null = null;

      await handleSubmit(
        (valid) => {
          values = valid;
        },
        // A folded card with a mistake opens, so its error is seen.
        () => setIsOpen(true),
      )();

      return values;
    };

    return onRegister(collection.id, { read });
  }, [collection.id, handleSubmit, onRegister]);

  return (
    <article aria-labelledby={headingId} className="flex flex-col rounded-lg border bg-background px-4 py-1.5">
      <div className="flex items-center justify-between gap-2">
        <CollectionCardToggle
          headingId={headingId}
          panelId={panelId}
          name={collection.name}
          isOpen={isOpen}
          summary={itemSummary(values, tags)}
          onToggle={() => setIsOpen(!isOpen)}
        />
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
      <FoldPanel id={panelId} isOpen={isOpen}>
        <ItemFormFields control={control} tags={tags} idPrefix={idPrefix} />
      </FoldPanel>
    </article>
  );
}

export default CollectionItemCard;
