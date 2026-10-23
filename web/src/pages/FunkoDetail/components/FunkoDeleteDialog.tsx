import { useFetcher } from 'react-router';
import type { CollectionItemApiModel, FunkoDetailApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import ConfirmDialog from '@components/ConfirmDialog';
import { GENERIC_WRITE_ERROR } from '@utils/errorMessageUtils';
import { createFormData } from '@utils/formDataUtils';

type Props = {
  funko: FunkoDetailApiModel;
  items: CollectionItemApiModel[];
  isOpen: boolean;
  onClose: () => void;
};

// The confirm dialog's answer: whether the extra "also remove it from its collections" box was ticked.
type ConfirmChoice = { isChecked: boolean };

const CONFLICT_STATUS = 409;
const STILL_IN_COLLECTION_MESSAGE = 'It is still in a collection: tick the box above to remove it from there as well.';

// What went wrong with the last delete, if it failed: still in a collection (409), or anything else.
function failureMessage(answer: JSONResponseUtil | undefined): string | undefined {
  if (answer?.success !== false) return undefined;

  if (answer.error?.statusCode === CONFLICT_STATUS) return STILL_IN_COLLECTION_MESSAGE;

  return GENERIC_WRITE_ERROR;
}

// Deleting is not undoable (photos go too), so it confirms. In a collection: the checkbox maps to ?force=true.
function FunkoDeleteDialog({ funko, items, isOpen, onClose }: Props) {
  const fetcher = useFetcher<JSONResponseUtil>();
  const collectionNames = [...new Set(items.map((item) => item.collection.name))];
  const isInCollections = collectionNames.length > 0;
  const errorMessage = failureMessage(fetcher.data);

  const confirm = ({ isChecked }: ConfirmChoice) =>
    void fetcher.submit(createFormData({ force: isChecked }), {
      method: HttpVerbsUtil.DELETE,
      action: FUNKO_ROUTES_PATHS.delete(String(funko.id)),
    });

  return (
    <ConfirmDialog
      isOpen={isOpen}
      title={`Delete ${funko.name}?`}
      description="Its images are deleted too. This cannot be undone."
      errorMessage={errorMessage}
      confirmLabel="Delete"
      isDestructive
      isPending={fetcher.state !== 'idle'}
      checkboxLabel={isInCollections ? `Also remove it from ${collectionNames.join(', ')}` : undefined}
      onConfirm={confirm}
      onClose={onClose}
    />
  );
}

export default FunkoDeleteDialog;
