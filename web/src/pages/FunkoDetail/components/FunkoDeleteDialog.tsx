import { useFetcher } from 'react-router';
import type { CollectionItemApiModel, FunkoDetailApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import ConfirmDialog from '@components/ConfirmDialog';
import { createFormData } from '@utils/formDataUtils';

type Props = {
  funko: FunkoDetailApiModel;
  items: CollectionItemApiModel[];
  isOpen: boolean;
  onClose: () => void;
};

const CONFLICT_STATUS = 409;

// Deleting is not undoable (photos go too), so it confirms. In a collection: the checkbox maps to ?force=true.
function FunkoDeleteDialog({ funko, items, isOpen, onClose }: Props) {
  const fetcher = useFetcher<JSONResponseUtil>();
  const collectionNames = [...new Set(items.map((item) => item.collection.name))];
  const isInCollections = collectionNames.length > 0;
  const hasConflict = fetcher.data?.success === false && fetcher.data.error?.statusCode === CONFLICT_STATUS;
  const hasOtherFailure = fetcher.data?.success === false && !hasConflict;

  const confirm = ({ isChecked }: { isChecked: boolean }) =>
    void fetcher.submit(createFormData({ force: isChecked }), {
      method: HttpVerbsUtil.DELETE,
      action: FUNKO_ROUTES_PATHS.delete(String(funko.id)),
    });

  return (
    <ConfirmDialog
      isOpen={isOpen}
      title={`Delete ${funko.name}?`}
      description={
        <>
          Its images are deleted too. This cannot be undone.
          {hasConflict ? ' It is still in a collection: tick the box below to remove it from there as well.' : ''}
          {hasOtherFailure ? ' Something went wrong. Please try again.' : ''}
        </>
      }
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
