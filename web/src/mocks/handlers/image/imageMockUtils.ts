import type { ImageListEntryApiModel } from '@app-types/models';
import { mockStore, type MockImageRow } from '@mocks/mockStore';
import { looseImageMock } from './models/imageMockModel.mock';

const STORED_SIZES = 3;
const MAIN_POSITION = 0;

function toListEntry(image: MockImageRow): ImageListEntryApiModel {
  const funko = mockStore.funkos.find((row) => row.id === image.funkoId);

  return {
    key: `${image.funkoId}/${image.id}`,
    id: image.id,
    funko: funko ? { id: funko.id, name: funko.name, number: funko.number } : null,
    fileName: `image-${image.id}.webp`,
    width: image.width,
    height: image.height,
    sizeBytes: image.sizeBytes,
    variantCount: STORED_SIZES,
    isMain: image.position === MAIN_POSITION,
    createdAt: image.createdAt,
    url: image.url,
    mediumUrl: image.mediumUrl,
    smallUrl: image.smallUrl,
    placeholder: image.placeholder,
  };
}

export const imageDisplayName = (entry: ImageListEntryApiModel) => entry.funko?.name ?? entry.fileName;

// What GET /images holds in mock mode: every mock funko image as a row, plus the one loose file.
export function allImageEntries(): ImageListEntryApiModel[] {
  return [...mockStore.images.map(toListEntry), looseImageMock];
}
