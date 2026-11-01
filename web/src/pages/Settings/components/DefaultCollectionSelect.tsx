import type { CollectionApiModel, CollectionId } from '@app-types/models';
import DisabledReason from '@components/DisabledReason';
import { NativeSelect, NativeSelectOption } from '@components/ui/native-select';
import { useReadOnlyReason } from '@hooks/useReadOnlyReason';
import { DISABLED_REASONS, firstReason, reasonWhen } from '@utils/disabledReasonUtils';

type Props = {
  id: string;
  collections: CollectionApiModel[];
  currentId: CollectionId | undefined;
  isBusy: boolean;
  onChange: (collectionId: string) => void;
};

// Every collection, the default one picked. Off, with the reason, while a change is saving or for a read-only user.
// Read-only keeps it focusable (aria-disabled, the pick ignored) so a keyboard user reaches the reason too; a native
// disabled select takes no focus.
function DefaultCollectionSelect({ id, collections, currentId, isBusy, onChange }: Props) {
  const readOnlyReason = useReadOnlyReason();
  const isReadOnly = readOnlyReason !== undefined;
  const reason = firstReason(readOnlyReason, reasonWhen(isBusy, DISABLED_REASONS.WORKING));

  const pick = (collectionId: string) => {
    if (!isReadOnly) onChange(collectionId);
  };

  return (
    <DisabledReason reason={reason} mode="wrapper" wrapperClassName="flex w-full">
      <NativeSelect
        id={id}
        value={String(currentId ?? '')}
        onChange={(event) => pick(event.target.value)}
        aria-disabled={isReadOnly || undefined}
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
