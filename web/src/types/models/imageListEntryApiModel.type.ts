import type { ImageFunkoApiModel } from './imageFunkoApiModel.type';
import type { NamedApiModel } from './namedApiModel.type';

// One stored image as GET /images lists it: an image row with its funko, or a loose file on disk no funko uses.
export interface ImageListEntryApiModel {
  // "<folder>/<fileKey>": unique for rows and loose files alike.
  key: string;
  // The funko image row; null for a loose file.
  id: number | null;
  funko: ImageFunkoApiModel | null;
  fileName: string;
  width: number | null;
  height: number | null;
  sizeBytes: number;
  // How many of the three stored sizes are on disk (3 when all is well).
  sizeCount: number;
  isMain: boolean;
  // Rows: when it was uploaded. Loose files: when the file was last written.
  createdAt: string;
  // Who uploaded it. Null for a loose file, and for a row whose uploader was deleted (a removed user).
  uploadedBy: NamedApiModel | null;
  url: string | null;
  mediumUrl: string | null;
  smallUrl: string | null;
  placeholder: string | null;
}
