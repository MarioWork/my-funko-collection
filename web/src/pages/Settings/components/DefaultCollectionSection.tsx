import { useFetcher } from 'react-router';
import type { CollectionApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import { COLLECTION_ROUTES_PATHS } from '@application/routes/routesUtils';
import InlineAlert from '@components/InlineAlert';
import { Field, FieldDescription, FieldLabel } from '@components/ui/field';
import { NativeSelect, NativeSelectOption } from '@components/ui/native-select';
import { useActionToast } from '@hooks/useActionToast';
import SettingsSection from './SettingsSection';

type Props = {
  collections: CollectionApiModel[];
};

const SELECT_ID = 'default-collection';

// Which list the detail page's first button toggles and where the Owned count on Home comes from. Server-side.
function DefaultCollectionSection({ collections }: Props) {
  const fetcher = useFetcher<JSONResponseUtil>();
  const current = collections.find((collection) => collection.isDefault);
  const isBusy = fetcher.state !== 'idle';
  const failure = fetcher.data?.success === false ? fetcher.data.error : undefined;

  const makeDefault = (collectionId: string) =>
    void fetcher.submit(null, { method: HttpVerbsUtil.POST, action: COLLECTION_ROUTES_PATHS.setDefault(collectionId) });

  useActionToast(fetcher, { successMessage: 'Default collection changed' });

  return (
    <SettingsSection title="Default collection" description="The list a funko is 'owned' in. Home counts this one.">
      <Field>
        <FieldLabel htmlFor={SELECT_ID}>Collection</FieldLabel>
        <NativeSelect
          id={SELECT_ID}
          value={String(current?.id ?? '')}
          onChange={(event) => makeDefault(event.target.value)}
          disabled={isBusy}
        >
          {collections.map((collection) => (
            <NativeSelectOption key={collection.id} value={String(collection.id)}>
              {collection.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <FieldDescription>Saved on the server, so every device agrees.</FieldDescription>
      </Field>
      {failure ? <InlineAlert tone="error">{failure.message ?? 'Could not change the default.'}</InlineAlert> : null}
    </SettingsSection>
  );
}

export default DefaultCollectionSection;
