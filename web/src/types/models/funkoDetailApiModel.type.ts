import type { FunkoApiModel } from './funkoApiModel.type';
import type { FunkoImageApiModel } from './funkoImageApiModel.type';

export interface FunkoDetailApiModel extends FunkoApiModel {
  images: FunkoImageApiModel[];
}
