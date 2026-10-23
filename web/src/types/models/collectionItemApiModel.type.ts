import type { ItemConditionUtil } from '@app-types/utility';
import type { FunkoSummaryApiModel } from './funkoSummaryApiModel.type';
import type { NamedApiModel } from './namedApiModel.type';

export interface CollectionItemApiModel {
  id: number;
  collection: NamedApiModel;
  funko: FunkoSummaryApiModel;
  quantity: number;
  condition: ItemConditionUtil | null;
  purchasePriceCents: number | null;
  purchaseCurrency: string;
  purchasedAt: string | null;
  notes: string | null;
  tags: NamedApiModel[];
  createdAt: string;
  updatedAt: string;
}

export type CollectionItemId = CollectionItemApiModel['id'];
