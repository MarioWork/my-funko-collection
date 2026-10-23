import type { ImageFunkoApiModel } from './imageFunkoApiModel.type';
import type { ImageListEntryApiModel } from './imageListEntryApiModel.type';

// One funko's images with their totals, as GET /images/groups lists them. The loose files share one group, "loose".
export interface ImageGroupApiModel {
  key: string;
  funko: ImageFunkoApiModel | null;
  imageCount: number;
  sizeBytes: number;
  newestCreatedAt: string;
  images: ImageListEntryApiModel[];
}
