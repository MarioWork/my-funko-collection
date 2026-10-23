import type { FunkoMatchFieldUtil, FunkoTypeUtil } from '@app-types/utility';

export interface PrimaryImageApiModel {
  smallUrl: string;
  mediumUrl: string;
  placeholder: string;
  width: number;
  height: number;
}

export interface NamedApiModel {
  id: number;
  name: string;
}

// The funko shape embedded in items and suggestions.
export interface FunkoSummaryApiModel {
  id: number;
  name: string;
  number: string;
  type: FunkoTypeUtil;
  isChase: boolean;
  exclusive: string;
  barcode: string | null;
  category: NamedApiModel;
  // The series it belongs to; optional.
  series: NamedApiModel | null;
  primaryImage: PrimaryImageApiModel | null;
}

export interface FunkoApiModel extends FunkoSummaryApiModel {
  collections: NamedApiModel[];
  matchedOn?: FunkoMatchFieldUtil[];
  createdAt: string;
  updatedAt: string;
}

export interface FunkoImageApiModel {
  id: number;
  url: string;
  mediumUrl: string;
  smallUrl: string;
  placeholder: string;
  width: number;
  height: number;
  sizeBytes: number;
  position: number;
  createdAt: string;
}

export interface FunkoDetailApiModel extends FunkoApiModel {
  images: FunkoImageApiModel[];
}

export type FunkoId = FunkoApiModel['id'];
export type FunkoImageId = FunkoImageApiModel['id'];
