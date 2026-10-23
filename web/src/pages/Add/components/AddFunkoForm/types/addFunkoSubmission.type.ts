import type { CreateFunko } from '@services/funkoService/funkoService.type';
import type { PendingPhoto } from '@utils/pendingPhotoUtils';
import type { AddItem } from '../../../addUtils';

// What one Save of the Add form hands over: the funko, one item per chosen collection, and the photos picked.
export type AddFunkoSubmission = {
  funko: CreateFunko;
  items: AddItem[];
  photos: PendingPhoto[];
};
