import type { FunkoSummaryApiModel, NamedApiModel } from './funkoApiModel.type';

export interface SuggestApiModel {
  funkos: FunkoSummaryApiModel[];
  categories: NamedApiModel[];
  series: NamedApiModel[];
  collections: NamedApiModel[];
  tags: NamedApiModel[];
}
