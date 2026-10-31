import type { ImageListEntryApiModel } from '@app-types/models';
import { createMockImageUrls } from '@mocks/mockImageUtils';

const LOOSE_FILE_SEED = 99;
const LOOSE_FILE_SIZE_BYTES = 48_000;

// A file left on disk that no funko uses (only the large size survived), as `yarn images:prune` would find.
export const looseImageMock: ImageListEntryApiModel = {
  key: '12/leftover',
  id: null,
  funko: null,
  fileName: 'leftover.webp',
  ...createMockImageUrls('Leftover', LOOSE_FILE_SEED),
  mediumUrl: null,
  smallUrl: null,
  placeholder: null,
  sizeBytes: LOOSE_FILE_SIZE_BYTES,
  sizeCount: 1,
  isMain: false,
  createdAt: '2024-01-15T10:00:00.000Z',
  uploadedBy: null,
};
