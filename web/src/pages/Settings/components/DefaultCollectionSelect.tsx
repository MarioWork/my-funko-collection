import type { CollectionApiModel, CollectionId } from '@app-types/models';
import DisabledReason from '@components/DisabledReason';
import { NativeSelect, NativeSelectOption } from '@components/ui/native-select';
import { useReadOnlyReason } from '@hooks/useReadOnlyReason';
import { DISABLED_REASONS, reasonWhen } from '@utils/disabledReasonUtils';

type Props = {
  id: string;
  collections: CollectionApiModel[];
  currentId: CollectionId | undefined;
  isBusy: boolean;
  onChange: (collectionId: string) => void;
};

// Every collection, the default one picked. Off, with the reason, while a change is saving or for a read-only user.
function DefaultCollectionSelect({ id, collections, currentId, isBusy, onChange }: Props) {
  const reason = useReadOnlyReason() ?? reasonWhen(isBusy, DISABLED_REASONS.WORKING);

  return (
    <DisabledReason reason={reason} mode="wrapper" wrapperClassName="flex w-full">
      <NativeSelect
        id={id}
        value={String(currentId ?? '')}
        onChange={(event) => onChange(event.target.value)}
        disabled={reason !== undefined}
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
