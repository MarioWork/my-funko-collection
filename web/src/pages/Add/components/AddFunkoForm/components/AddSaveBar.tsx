import { Save } from 'lucide-react';
import FunkoFormError from '@components/FunkoFormError';
import FunkoImage from '@components/FunkoImage';
import SubmitButton from '@components/SubmitButton';
import type { PendingPhoto } from '@utils/pendingPhotoUtils';

type Props = {
  formId: string;
  mainPhoto: PendingPhoto | undefined;
  collectionNames: string[];
  isSubmitting: boolean;
  errorMessage?: string;
  existingFunkoId?: number;
};

// Every funko goes in the catalog; the collections come on top of it.
const CATALOG_NAME = 'Catalog';
const NO_PHOTO_ALT = 'New funko';
const THUMB_SIZES = '64px';

// What Save will do, and Save itself. A column beside the form on a computer, so it stays in view however long
// the form gets; on a phone the button sticks above the bottom bar and the summary is left out.
function AddSaveBar({ formId, mainPhoto, collectionNames, isSubmitting, errorMessage, existingFunkoId }: Props) {
  const destination = [CATALOG_NAME, ...collectionNames].join(', ');

  return (
    // `contents` on a phone: the button's sticky box then spans the whole form, not just this column.
    <div className="contents lg:sticky lg:top-4 lg:flex lg:flex-col lg:gap-3 lg:rounded-xl lg:border lg:bg-card lg:p-4">
      <div className="hidden gap-3 lg:flex">
        {mainPhoto ? (
          <img src={mainPhoto.previewUrl} alt="" className="aspect-3/4 w-16 shrink-0 rounded-md object-cover" />
        ) : (
          <FunkoImage
            image={null}
            alt={NO_PHOTO_ALT}
            sizes={THUMB_SIZES}
            className="aspect-3/4 w-16 shrink-0 rounded-md"
          />
        )}
        <dl className="flex min-w-0 flex-col gap-0.5 text-sm">
          <dt className="text-muted-foreground">Saving to</dt>
          <dd className="font-medium">{destination}</dd>
        </dl>
      </div>
      {errorMessage ? <FunkoFormError message={errorMessage} existingFunkoId={existingFunkoId} /> : null}
      <div className="sticky bottom-[calc(var(--bottom-nav-height,0px)+env(safe-area-inset-bottom))] -mx-4 border-t bg-background p-4 lg:static lg:m-0 lg:border-0 lg:bg-transparent lg:p-0">
        <SubmitButton
          form={formId}
          isSubmitting={isSubmitting}
          className="w-full"
          icon={<Save data-icon="inline-start" aria-hidden="true" />}
        >
          Save funko
        </SubmitButton>
      </div>
    </div>
  );
}

export default AddSaveBar;
