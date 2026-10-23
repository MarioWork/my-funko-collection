import { redirect, type ActionFunctionArgs } from 'react-router';
import { ValidationError } from 'yup';
import type { JSONResponseUtil } from '@app-types/utility';
import { HttpVerbsUtil } from '@app-types/utility';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import { PHOTO_FIELD } from '@utils/pendingPhotoUtils';
import collectionItemService, { ItemApiSearchFields } from '@services/collectionItemService/collectionItemService';
import funkoImageService from '@services/funkoImageService/funkoImageService';
import { ReorderImagesSchema, RotateImageSchema } from '@services/funkoImageService/funkoImageService.type';
import funkoService from '@services/funkoService/funkoService';
import { parseFormData } from '@utils/formDataUtils';
import { newItemPayload } from '@utils/newItemUtils';

type DeleteFunkoFormData = { force?: boolean };
type MembershipFormData = { collectionId: number };
type ReorderFormData = { imageIds: number[] };
type RotateFormData = { degrees: number };

// DELETE /funkos/:funkoId, with `force` from the confirm dialog's checkbox. Success leaves the page.
export const deleteFunkoAction = async ({
  request,
  params,
}: ActionFunctionArgs): Promise<JSONResponseUtil | Response> => {
  const { force } = parseFormData<DeleteFunkoFormData>(await request.formData());
  const result = await funkoService.deleteFunko(Number(params.funkoId), { force: force === true });

  return result.success ? redirect(FUNKO_ROUTES_PATHS.BASE) : result;
};

// POST adds the funko to a collection, DELETE removes it: the detail page's Owned toggle and Lists menu.
export const membershipAction = async ({ request, params }: ActionFunctionArgs): Promise<JSONResponseUtil> => {
  const funkoId = Number(params.funkoId);
  const { collectionId } = parseFormData<MembershipFormData>(await request.formData());

  if (request.method === HttpVerbsUtil.POST) {
    return collectionItemService.addCollectionItem(collectionId, newItemPayload(funkoId));
  }

  const items = await collectionItemService.getCollectionItems(collectionId, {
    pagination: { page: '1', size: '1' },
    [ItemApiSearchFields.FUNKO_ID]: String(funkoId),
  });
  const item = items.data[0];

  if (!item) return { success: false };

  return collectionItemService.deleteCollectionItem(collectionId, item.id);
};

// POST uploads photos (multipart, field "file"); PATCH reorders them.
export const funkoImagesAction = async ({ request, params }: ActionFunctionArgs): Promise<JSONResponseUtil> => {
  const funkoId = Number(params.funkoId);
  const formData = await request.formData();

  if (request.method === HttpVerbsUtil.POST) {
    const files = formData.getAll(PHOTO_FIELD).filter((value): value is File => value instanceof File);

    return funkoImageService.addFunkoImages(funkoId, files);
  }

  const { imageIds } = parseFormData<ReorderFormData>(formData);

  try {
    const valid = await ReorderImagesSchema.validate({ imageIds });

    return await funkoImageService.reorderFunkoImages(funkoId, valid);
  } catch (error) {
    if (error instanceof ValidationError) return { success: false };

    throw error;
  }
};

// POST rotates one image; DELETE removes it.
export const funkoImageAction = async ({ request, params }: ActionFunctionArgs): Promise<JSONResponseUtil> => {
  const funkoId = Number(params.funkoId);
  const imageId = Number(params.imageId);

  if (request.method === HttpVerbsUtil.DELETE) return funkoImageService.deleteFunkoImage(funkoId, imageId);

  const { degrees } = parseFormData<RotateFormData>(await request.formData());

  try {
    const valid = await RotateImageSchema.validate({ degrees });

    return await funkoImageService.rotateFunkoImage(funkoId, imageId, valid);
  } catch (error) {
    if (error instanceof ValidationError) return { success: false };

    throw error;
  }
};
