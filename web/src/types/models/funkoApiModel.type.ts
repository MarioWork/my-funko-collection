import type { FunkoMatchFieldUtil } from '@app-types/utility';
import type { FunkoSummaryApiModel } from './funkoSummaryApiModel.type';
import type { NamedApiModel } from './namedApiModel.type';

export interface FunkoApiModel extends FunkoSummaryApiModel {
  collections: NamedApiModel[];
  matchedOn?: FunkoMatchFieldUtil[];
  createdAt: string;
  updatedAt: string;
}

export type FunkoId = FunkoApiModel['id'];
