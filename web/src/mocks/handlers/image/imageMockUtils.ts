import type { ImageListEntryApiModel, NamedApiModel } from '@app-types/models';
import { mockStore } from '@mocks/mockStore';
import type { MockImageRow } from '@mocks/mockStore.type';
import { looseImageMock } from './models/imageMockModel.mock';

const STORED_SIZES = 3;
export const MAIN_POSITION = 0;

// The signed-in user or another one; an id nobody has belonged to a user who is gone, as the API would have cleared it.
function toUploader(uploadedById: number | null): NamedApiModel | null {
  const { auth, users } = mockStore;

  if (uploadedById === auth.userId) return { id: auth.userId, name: auth.userName };

  const uploader = users.find((user) => user.id === uploadedById);

  return uploader ? { id: uploader.id, name: uploader.name } : null;
}

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
    sizeCount: STORED_SIZES,
    isMain: image.position === MAIN_POSITION,
    createdAt: image.createdAt,
    uploadedBy: toUploader(image.uploadedById),
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
