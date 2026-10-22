import { axiosActions } from '@api/axiosActions';
import type { FunkoId, FunkoImageApiModel, FunkoImageId } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import type { ImageFromUrl, ReorderImages, RotateImage } from './funkoImageService.type';

const BASE_FUNKOS_URL = '/funkos';
const IMAGES_SEGMENT = 'images';
const FROM_URL_SEGMENT = 'from-url';
const ORDER_SEGMENT = 'order';
const ROTATE_SEGMENT = 'rotate';
// The multipart field name the API reads every file from.
export const IMAGE_FILE_FIELD = 'file';
const CONTENT_TYPE_HEADER = 'Content-Type';
const MULTIPART_CONTENT_TYPE = 'multipart/form-data';

function imagesUrl(funkoId: FunkoId): string {
  return `${BASE_FUNKOS_URL}/${funkoId}/${IMAGES_SEGMENT}`;
}

export default {
  // One multipart request per batch; the server makes every size. Caller passes already-resized files.
  addFunkoImages: async (funkoId: FunkoId, files: File[]): Promise<JSONResponseUtil<FunkoImageApiModel[]>> => {
    const body = new FormData();

    for (const file of files) body.append(IMAGE_FILE_FIELD, file, file.name);

    // Told explicitly: with a FormData body axios otherwise labels the request urlencoded under the fetch adapter,
    // and lets the runtime add the multipart boundary when it sees this value.
    return axiosActions<FunkoImageApiModel[]>({
      url: imagesUrl(funkoId),
      method: HttpVerbsUtil.POST,
      data: body,
      headers: { [CONTENT_TYPE_HEADER]: MULTIPART_CONTENT_TYPE },
    });
  },

  addFunkoImageFromUrl: async (funkoId: FunkoId, fields: ImageFromUrl): Promise<JSONResponseUtil<FunkoImageApiModel>> =>
    axiosActions<FunkoImageApiModel>({
      url: `${imagesUrl(funkoId)}/${FROM_URL_SEGMENT}`,
      method: HttpVerbsUtil.POST,
      data: fields,
    }),

  reorderFunkoImages: async (
    funkoId: FunkoId,
    fields: ReorderImages,
  ): Promise<JSONResponseUtil<FunkoImageApiModel[]>> =>
    axiosActions<FunkoImageApiModel[]>({
      url: `${imagesUrl(funkoId)}/${ORDER_SEGMENT}`,
      method: HttpVerbsUtil.PATCH,
      data: fields,
    }),

  rotateFunkoImage: async (
    funkoId: FunkoId,
    imageId: FunkoImageId,
    fields: RotateImage,
  ): Promise<JSONResponseUtil<FunkoImageApiModel>> =>
    axiosActions<FunkoImageApiModel>({
      url: `${imagesUrl(funkoId)}/${imageId}/${ROTATE_SEGMENT}`,
      method: HttpVerbsUtil.POST,
      data: fields,
    }),

  deleteFunkoImage: async (funkoId: FunkoId, imageId: FunkoImageId): Promise<JSONResponseUtil> =>
    axiosActions({ url: `${imagesUrl(funkoId)}/${imageId}`, method: HttpVerbsUtil.DELETE }),
};
