import type { CollectionApiModel, CollectionId } from '@app-types/models';
import DisabledReason from '@components/DisabledReason';
import { NativeSelect, NativeSelectOption } from '@components/ui/native-select';
import { DISABLED_REASONS, reasonWhen } from '@utils/disabledReasonUtils';

type Props = {
  id: string;
  collections: CollectionApiModel[];
  currentId: CollectionId | undefined;
  isBusy: boolean;
  onChange: (collectionId: string) => void;
};

// Every collection, the default one picked. Off, with the reason, while a change is saving.
function DefaultCollectionSelect({ id, collections, currentId, isBusy, onChange }: Props) {
  return (
    <DisabledReason reason={reasonWhen(isBusy, DISABLED_REASONS.WORKING)} mode="wrapper" wrapperClassName="flex w-full">
      <NativeSelect
        id={id}
        value={String(currentId ?? '')}
        onChange={(event) => onChange(event.target.value)}
        disabled={isBusy}
      >
        {collections.map((collection) => (
          <NativeSelectOption key={collection.id} value={String(collection.id)}>
            {collection.name}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </DisabledReason>
  );
}

export default DefaultCollectionSelect;
