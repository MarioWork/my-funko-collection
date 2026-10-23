import type { FunkoSummaryApiModel } from './funkoSummaryApiModel.type';
import type { NamedApiModel } from './namedApiModel.type';

export interface SuggestApiModel {
  funkos: FunkoSummaryApiModel[];
  categories: NamedApiModel[];
  series: NamedApiModel[];
  collections: NamedApiModel[];
  tags: NamedApiModel[];
}
