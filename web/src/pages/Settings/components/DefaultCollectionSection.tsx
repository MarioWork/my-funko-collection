import { useFetcher } from 'react-router';
import type { CollectionApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import { COLLECTION_ROUTES_PATHS } from '@application/routes/routesUtils';
import InlineAlert from '@components/InlineAlert';
import { Field, FieldDescription, FieldLabel } from '@components/ui/field';
import { useActionToast } from '@hooks/useActionToast';
import { GENERIC_WRITE_ERROR } from '@utils/errorMessageUtils';
import DefaultCollectionSelect from './DefaultCollectionSelect';
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
        <DefaultCollectionSelect
          id={SELECT_ID}
          collections={collections}
          currentId={current?.id}
          isBusy={isBusy}
          onChange={makeDefault}
        />
        <FieldDescription>Saved on the server, so every device agrees.</FieldDescription>
      </Field>
      {failure ? <InlineAlert tone="error">{failure.message ?? GENERIC_WRITE_ERROR}</InlineAlert> : null}
    </SettingsSection>
  );
}

export default DefaultCollectionSection;
