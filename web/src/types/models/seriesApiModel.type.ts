export interface SeriesApiModel {
  id: number;
  name: string;
  funkoCount: number;
  createdAt: string;
  updatedAt: string;
}

export type SeriesId = SeriesApiModel['id'];
