import type { CollectionItemApiModel, FunkoDetailApiModel } from '@app-types/models';
import { otherUserCountOf } from '../funkoDetailUtils';
import FunkoConfirmDeleteDialog from './FunkoConfirmDeleteDialog';
import FunkoRemoveDialog from './FunkoRemoveDialog';

type Props = {
  funko: FunkoDetailApiModel;
  items: CollectionItemApiModel[];
  isOpen: boolean;
  onClose: () => void;
};

// Only in the user's own collections (or none): a plain confirm. In other users' collections too (an admin's count
// says so): the remove dialog asks why, since each of them is told.
function FunkoDeleteDialog({ funko, items, isOpen, onClose }: Props) {
  const otherUserCount = otherUserCountOf(funko, items);

  if (otherUserCount > 0) {
    return <FunkoRemoveDialog funko={funko} otherUserCount={otherUserCount} isOpen={isOpen} onClose={onClose} />;
  }

  return <FunkoConfirmDeleteDialog funko={funko} items={items} isOpen={isOpen} onClose={onClose} />;
}

export default FunkoDeleteDialog;
