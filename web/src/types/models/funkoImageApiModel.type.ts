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

export type FunkoImageId = FunkoImageApiModel['id'];
