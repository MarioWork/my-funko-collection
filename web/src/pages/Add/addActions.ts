import type { ActionFunctionArgs } from 'react-router';
import { ValidationError } from 'yup';
import type { FunkoApiModel } from '@app-types/models';
import type { JSONResponseUtil } from '@app-types/utility';
import collectionItemService, { ItemApiSearchFields } from '@services/collectionItemService/collectionItemService';
import funkoImageService from '@services/funkoImageService/funkoImageService';
import funkoService from '@services/funkoService/funkoService';
import { CreateFunkoSchema, type CreateFunko } from '@services/funkoService/funkoService.type';
import { type AddDestination } from '@utils/addDestinationUtils';
import { parseFormData } from '@utils/formDataUtils';
import { newItemPayload } from '@utils/newItemUtils';
import { PHOTO_FIELD } from '@utils/pendingPhotoUtils';
import { AddIntentUtil, destinationSchema, incrementSchema, type AddResult } from './addUtils';

type CreateFormData = {
  intent: typeof AddIntentUtil.CREATE;
  funko: CreateFunko;
  destination: AddDestination;
};

type IncrementFormData = {
  intent: typeof AddIntentUtil.INCREMENT;
  funkoId: number;
  destination: AddDestination;
};

export type AddActionData = JSONResponseUtil<AddResult>;

const MIN_PHOTOS = 1;
const PHOTOS_REQUIRED = 'Add at least one image.';
const PHOTOS_WARNING = 'The images did not upload. Add them from its page.';
const COLLECTION_WARNING = 'It could not be added to one of the lists. Add it from its page.';

async function uploadPhotos(funkoId: number, photos: File[]): Promise<string[]> {
  if (photos.length === 0) return [];

  const uploaded = await funkoImageService.addFunkoImages(funkoId, photos);

  return uploaded.success ? [] : [PHOTOS_WARNING];
}

async function fileInCollections(funkoId: number, { collectionIds, tagIds }: AddDestination): Promise<string[]> {
  const results = await Promise.all(
    collectionIds.map((collectionId) =>
      collectionItemService.addCollectionItem(collectionId, newItemPayload(funkoId, tagIds)),
    ),
  );
  const hasFailure = results.some((result) => !result.success);

  return hasFailure ? [COLLECTION_WARNING] : [];
}

// A box already in the list gets one more; a list without it gets a new item with the chosen tags.
async function incrementInCollection(funkoId: number, collectionId: number, tagIds: number[]) {
  const existing = await collectionItemService.getCollectionItems(collectionId, {
    pagination: { page: '1', size: '1' },
    [ItemApiSearchFields.FUNKO_ID]: String(funkoId),
  });
  const item = existing.data[0];

  if (!item) return collectionItemService.addCollectionItem(collectionId, newItemPayload(funkoId, tagIds));

  return collectionItemService.updateCollectionItem(collectionId, item.id, { quantity: item.quantity + 1 });
}

// Read back after the writes so the saved card shows the photo and the lists it is now in. The funko exists by
// now, so a failed read falls back to what the create returned rather than losing the success.
async function latestFunko(fallback: FunkoApiModel): Promise<FunkoApiModel> {
  try {
    return await funkoService.getFunko(fallback.id);
  } catch {
    return fallback;
  }
}

// Needs at least one photo. Creates the funko first (the photos and items need its id), then uploads the photos and files it in every chosen
// collection. Only a failed create is a failure; a later step that fails becomes a warning on the saved card.
async function createAndFile({ funko, destination }: CreateFormData, photos: File[]): Promise<AddActionData> {
  const validFunko = await CreateFunkoSchema.validate(funko);
  const validDestination = await destinationSchema.validate(destination);

  if (photos.length < MIN_PHOTOS) return { success: false, error: { message: PHOTOS_REQUIRED } };

  const created = await funkoService.addFunko(validFunko);

  if (!created.success || !created.data) return { success: false, error: created.error };

  const photoWarnings = await uploadPhotos(created.data.id, photos);
  const collectionWarnings = await fileInCollections(created.data.id, validDestination);

  return {
    success: true,
    data: { funko: await latestFunko(created.data), warnings: [...photoWarnings, ...collectionWarnings] },
  };
}

// "+1": a scanned box you already have bumps the quantity in each chosen list instead of creating a duplicate.
async function incrementInDestination({ funkoId, destination }: IncrementFormData): Promise<AddActionData> {
  const valid = await incrementSchema.validate({ funkoId, ...destination });
  const results = await Promise.all(
    valid.collectionIds.map((collectionId) => incrementInCollection(valid.funkoId, collectionId, valid.tagIds)),
  );
  const failed = results.find((result) => !result.success);

  if (failed) return { success: false, error: failed.error };

  return { success: true, data: { funko: await funkoService.getFunko(valid.funkoId), warnings: [] } };
}

export const addFunkoAction = async ({ request }: ActionFunctionArgs): Promise<AddActionData> => {
  const formData = await request.formData();
  const photos = formData.getAll(PHOTO_FIELD).filter((value): value is File => value instanceof File);
  const data = parseFormData<CreateFormData | IncrementFormData>(formData);

  try {
    if (data.intent === AddIntentUtil.INCREMENT) return await incrementInDestination(data);

    return await createAndFile(data, photos);
  } catch (error) {
    if (error instanceof ValidationError) return { success: false };

    throw error;
  }
};
