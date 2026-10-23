import type { CollectionId } from '@app-types/models';
import type { CreateFunko } from '@services/funkoService/funkoService.type';

// What one Save of FunkoEditForm hands over: the funko's details and the collections it should be in.
export type FunkoEditSubmission = {
  funko: CreateFunko;
  collectionIds: CollectionId[];
};
