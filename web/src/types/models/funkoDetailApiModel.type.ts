import type { FunkoApiModel } from './funkoApiModel.type';
import type { FunkoImageApiModel } from './funkoImageApiModel.type';
import type { NamedApiModel } from './namedApiModel.type';

export interface FunkoDetailApiModel extends FunkoApiModel {
  images: FunkoImageApiModel[];
  // Admins only, on a submission: who sent it in, or null once that user was deleted (a removed user).
  submittedBy?: NamedApiModel | null;
}
