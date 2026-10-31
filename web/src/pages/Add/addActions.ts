import type { ActionFunctionArgs } from 'react-router';
import type { FunkoApiModel } from '@app-types/models';
import { DEFAULT_FIRST_PAGE, type JSONResponseUtil } from '@app-types/utility';
import collectionItemService, { ItemApiSearchFields } from '@services/collectionItemService/collectionItemService';
import { CreateCollectionItemSchema } from '@services/collectionItemService/collectionItemService.type';
import funkoImageService from '@services/funkoImageService/funkoImageService';
import funkoService from '@services/funkoService/funkoService';
import { CreateFunkoSchema, type CreateFunko } from '@services/funkoService/funkoService.type';
import { type AddDestination } from '@utils/addDestinationUtils';
import { parseFormData } from '@utils/formDataUtils';
import { newItemPayload } from '@utils/newItemUtils';
import { PHOTO_FIELD } from '@utils/pendingPhotoUtils';
import { AddIntentUtil, collectionIdSchema, incrementSchema, type AddItem, type AddResult } from './addUtils';
import { failWhenInvalid } from '@utils/actionUtils';

type CreateFormData = {
  intent: typeof AddIntentUtil.CREATE;
  funko: CreateFunko;
  // One per chosen collection; none means the catalog only.
  items: AddItem[];
};

type IncrementFormData = {
  intent: typeof AddIntentUtil.INCREMENT;
  funkoId: number;
  destination: AddDestination;
};

export type AddActionData = JSONResponseUtil<AddResult>;

const MIN_PHOTOS = 1;
// The funko's item, if any, is the one match: a funko sits in a collection at most once.
const SINGLE_ITEM_PAGE_SIZE = '1';
const PHOTOS_REQUIRED = 'Add at least one image.';
const NEW_ITEM_DETAILS_SCHEMA = CreateCollectionItemSchema.omit(['funkoId']);
const PHOTOS_FAILED = 'The images did not upload, so nothing was saved. Please try again.';
const COLLECTION_FAILED = 'It could not be added to one of the lists, so nothing was saved. Please try again.';
// The undo itself failed: the funko is there without everything, and the error links to it (existingId).
const PARTLY_SAVED = 'It was saved, but not completely. Open it to finish.';

type StepResult = { success: true } | { success: false; message: string };

async function uploadPhotos(funkoId: number, photos: File[]): Promise<StepResult> {
  const uploaded = await funkoImageService.addFunkoImages(funkoId, photos);

  if (uploaded.success) return { success: true };

  return { success: false, message: uploaded.error?.message ?? PHOTOS_FAILED };
}

// Checked before anything is written: a bad item must stop the save before the funko exists.
async function validateItem({ collectionId, ...details }: AddItem): Promise<AddItem> {
  const validCollectionId = await collectionIdSchema.validate(collectionId);
  const validDetails = await NEW_ITEM_DETAILS_SCHEMA.validate(details);

  return { ...validDetails, collectionId: validCollectionId };
}

async function fileInCollections(funkoId: number, items: AddItem[]): Promise<StepResult> {
  const results = await Promise.all(
    items.map(({ collectionId, ...details }) =>
      collectionItemService.addCollectionItem(collectionId, { ...details, funkoId }),
    ),
  );
  const hasFailure = results.some((result) => !result.success);

  if (hasFailure) return { success: false, message: COLLECTION_FAILED };

  return { success: true };
}

// All or nothing: a later step failed, so the new funko goes again (force: out of any list it already reached,
// its images with it) and the form shows why. If even that fails, the error links to the half-saved funko.
async function undoCreate(funkoId: number, message: string): Promise<AddActionData> {
  const removed = await funkoService.deleteFunko(funkoId, { force: true });

  if (!removed.success) return { success: false, error: { message: PARTLY_SAVED, existingId: funkoId } };

  return { success: false, error: { message } };
}

// A box already in the list gets one more; a list without it gets a new item with the chosen tags.
async function incrementInCollection(funkoId: number, collectionId: number, tagIds: number[]) {
  const fields = {
    pagination: { page: DEFAULT_FIRST_PAGE, size: SINGLE_ITEM_PAGE_SIZE },
    [ItemApiSearchFields.FUNKO_ID]: String(funkoId),
  };
  const existing = await collectionItemService.getCollectionItems(collectionId, fields);
  const item = existing.data[0];

  if (!item) return collectionItemService.addCollectionItem(collectionId, newItemPayload(funkoId, tagIds));

  return collectionItemService.updateCollectionItem(collectionId, item.id, { quantity: item.quantity + 1 });
}

// Read back after the writes so the saved card shows the photo and the lists it is now in. The funko exists by
// now, so a failed read falls back to what the create returned rather than losing the success. A deliberate
// exception to "do not try/catch a read" (ts-api-services §7.3): throwing here would show the error page for a
// funko that was saved.
async function latestFunko(fallback: FunkoApiModel): Promise<FunkoApiModel> {
  try {
    return await funkoService.getFunko(fallback.id);
  } catch {
    return fallback;
  }
}

// Needs at least one photo. Creates the funko first (the photos and items need its id), then uploads the photos and
// files it in every chosen collection, each with its own details. All or nothing: if a later step fails, the funko is deleted again.
async function createAndFile({ funko, items }: CreateFormData, photos: File[]): Promise<AddActionData> {
  const validFunko = await CreateFunkoSchema.validate(funko);
  const validItems = await Promise.all(items.map(validateItem));

  if (photos.length < MIN_PHOTOS) return { success: false, error: { message: PHOTOS_REQUIRED } };

  const created = await funkoService.addFunko(validFunko);

  if (!created.success || !created.data) return { success: false, error: created.error };

  const funkoId = created.data.id;
  const photosResult = await uploadPhotos(funkoId, photos);

  if (!photosResult.success) return undoCreate(funkoId, photosResult.message);

  const collectionsResult = await fileInCollections(funkoId, validItems);

  if (!collectionsResult.success) return undoCreate(funkoId, collectionsResult.message);

  return { success: true, data: { funko: await latestFunko(created.data) } };
}

// "+1": a scanned box you already have bumps the quantity in each chosen list instead of creating a duplicate.
async function incrementInDestination({ funkoId, destination }: IncrementFormData): Promise<AddActionData> {
  const valid = await incrementSchema.validate({ funkoId, ...destination });
  const results = await Promise.all(
    valid.collectionIds.map((collectionId) => incrementInCollection(valid.funkoId, collectionId, valid.tagIds)),
  );
  const failed = results.find((result) => !result.success);

  if (failed) return { success: false, error: failed.error };

  return { success: true, data: { funko: await funkoService.getFunko(valid.funkoId) } };
}

export const addFunkoAction = async ({ request }: ActionFunctionArgs): Promise<AddActionData> => {
  const formData = await request.formData();
  const photos = formData.getAll(PHOTO_FIELD).filter((value): value is File => value instanceof File);
  const data = parseFormData<CreateFormData | IncrementFormData>(formData);

  return failWhenInvalid(async () => {
    if (data.intent === AddIntentUtil.INCREMENT) return incrementInDestination(data);

    return createAndFile(data, photos);
  });
};
