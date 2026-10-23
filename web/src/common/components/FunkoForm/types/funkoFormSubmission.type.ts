import type { CreateFunko } from '@services/funkoService/funkoService.type';
import type { AddDestination } from '@utils/addDestinationUtils';
import type { PendingPhoto } from '@utils/pendingPhotoUtils';

// What one Save of FunkoForm hands over: the funko, where it goes, and the photos picked (always empty in edit
// mode, where photos change right away through FunkoPhotoManager).
export type FunkoFormSubmission = {
  funko: CreateFunko;
  destination: AddDestination;
  photos: PendingPhoto[];
};
