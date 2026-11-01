import { redirect, type ActionFunctionArgs } from 'react-router';
import { number } from 'yup';
import { DEFAULT_FIRST_PAGE, HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import { PHOTO_FIELD } from '@utils/pendingPhotoUtils';
import collectionItemService, { ItemApiSearchFields } from '@services/collectionItemService/collectionItemService';
import { CreateCollectionItemSchema } from '@services/collectionItemService/collectionItemService.type';
import funkoImageService from '@services/funkoImageService/funkoImageService';
import { ReorderImagesSchema, RotateImageSchema } from '@services/funkoImageService/funkoImageService.type';
import funkoService from '@services/funkoService/funkoService';
import { RemoveFunkoSchema } from '@services/funkoService/funkoService.type';
import { parseFormData } from '@utils/formDataUtils';
import { newItemPayload } from '@utils/newItemUtils';
import { failWhenInvalid } from '@utils/actionUtils';

type DeleteFunkoFormData = { force?: boolean; reason?: string };
type MembershipFormData = { collectionId: number };
type ReorderFormData = { imageIds: number[] };
type RotateFormData = { degrees: number };

// The funko's item, if any, is the one match: a funko sits in a collection at most once.
const SINGLE_ITEM_PAGE_SIZE = '1';

const collectionIdSchema = number().integer().positive().required();

// The reason checked against the service's schema; none when the dialog sent none (nobody else has the funko).
async function validRemovalReason(reason: string | undefined): Promise<string | undefined> {
  if (reason === undefined) return undefined;

  const valid = await RemoveFunkoSchema.validate({ reason });

  return valid.reason;
}

// DELETE /funkos/:funkoId, with `force` from the confirm dialog's checkbox, or `force` and the reason from the
// dialog for a funko other users have. Success leaves the page.
export const deleteFunkoAction = async ({
  request,
  params,
}: ActionFunctionArgs): Promise<JSONResponseUtil | Response> => {
  const { force, reason } = parseFormData<DeleteFunkoFormData>(await request.formData());

  return failWhenInvalid(async () => {
    const validReason = await validRemovalReason(reason);
    const result = await funkoService.deleteFunko(Number(params.funkoId), {
      force: force === true,
      reason: validReason,
    });

    return result.success ? redirect(FUNKO_ROUTES_PATHS.BASE) : result;
  });
};

// The funko's one item in that collection, removed. Nothing to remove is a failure.
async function removeFromCollection(funkoId: number, collectionId: number): Promise<JSONResponseUtil> {
  const fields = {
    pagination: { page: DEFAULT_FIRST_PAGE, size: SINGLE_ITEM_PAGE_SIZE },
    [ItemApiSearchFields.FUNKO_ID]: String(funkoId),
  };
  const items = await collectionItemService.getCollectionItems(collectionId, fields);
  const item = items.data[0];

  if (!item) return { success: false };

  return collectionItemService.deleteCollectionItem(collectionId, item.id);
}

// POST adds the funko to a collection, DELETE removes it: the detail page's Owned toggle and Lists menu.
export const membershipAction = async ({ request, params }: ActionFunctionArgs): Promise<JSONResponseUtil> => {
  const funkoId = Number(params.funkoId);
  const { collectionId } = parseFormData<MembershipFormData>(await request.formData());

  return failWhenInvalid(async () => {
    const validCollectionId = await collectionIdSchema.validate(collectionId);

    if (request.method === HttpVerbsUtil.POST) {
      const validItem = await CreateCollectionItemSchema.validate(newItemPayload(funkoId));

      return collectionItemService.addCollectionItem(validCollectionId, validItem);
    }

    return removeFromCollection(funkoId, validCollectionId);
  });
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

  return failWhenInvalid(async () => {
    const valid = await ReorderImagesSchema.validate({ imageIds });

    return funkoImageService.reorderFunkoImages(funkoId, valid);
  });
};

// POST rotates one image; DELETE removes it.
export const funkoImageAction = async ({ request, params }: ActionFunctionArgs): Promise<JSONResponseUtil> => {
  const funkoId = Number(params.funkoId);
  const imageId = Number(params.imageId);

  if (request.method === HttpVerbsUtil.DELETE) return funkoImageService.deleteFunkoImage(funkoId, imageId);

  const { degrees } = parseFormData<RotateFormData>(await request.formData());

  return failWhenInvalid(async () => {
    const valid = await RotateImageSchema.validate({ degrees });

    return funkoImageService.rotateFunkoImage(funkoId, imageId, valid);
  });
};
