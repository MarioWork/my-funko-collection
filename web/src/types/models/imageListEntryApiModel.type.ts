import type { NamedApiModel } from './funkoApiModel.type';

// One stored image as GET /images lists it: an image row with its funko, or a loose file on disk no funko uses.
export interface ImageListEntryApiModel {
  // "<folder>/<fileKey>": unique for rows and loose files alike.
  key: string;
  // The funko image row; null for a loose file.
  id: number | null;
  funko: (NamedApiModel & { number: string }) | null;
  fileName: string;
  width: number | null;
  height: number | null;
  sizeBytes: number;
  // How many of the three stored sizes are on disk (3 when all is well).
  variantCount: number;
  isMain: boolean;
  createdAt: string;
  url: string | null;
  mediumUrl: string | null;
  smallUrl: string | null;
  placeholder: string | null;
}

export type ImageListEntryKey = ImageListEntryApiModel['key'];

// One funko's images with their totals, as GET /images/groups lists them. The loose files share one group, "loose".
export interface ImageGroupApiModel {
  key: string;
  funko: (NamedApiModel & { number: string }) | null;
  imageCount: number;
  sizeBytes: number;
  newestCreatedAt: string;
  images: ImageListEntryApiModel[];
}
