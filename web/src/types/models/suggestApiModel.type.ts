import type { FunkoSummaryApiModel, NamedApiModel } from './funkoApiModel.type';

export interface SuggestApiModel {
  funkos: FunkoSummaryApiModel[];
  categories: NamedApiModel[];
  collections: NamedApiModel[];
  tags: NamedApiModel[];
}
