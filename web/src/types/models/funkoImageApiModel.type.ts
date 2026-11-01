import type { NamedApiModel } from './namedApiModel.type';

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
  // Who uploaded it; null once that user was deleted (shown as "Removed user").
  uploadedBy: NamedApiModel | null;
}

export type FunkoImageId = FunkoImageApiModel['id'];
