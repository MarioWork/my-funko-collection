import type { ActionFunctionArgs } from 'react-router';
import { array, number } from 'yup';
import type { FunkoApiModel } from '@app-types/models';
import { DEFAULT_FIRST_PAGE, type JSONResponseUtil } from '@app-types/utility';
import collectionItemService, { ItemApiSearchFields } from '@services/collectionItemService/collectionItemService';
import funkoService from '@services/funkoService/funkoService';
import { UpdateFunkoSchema, type UpdateFunko } from '@services/funkoService/funkoService.type';
import { parseFormData } from '@utils/formDataUtils';
import { newItemPayload } from '@utils/newItemUtils';
import { FUNKO_ITEMS_PAGE_SIZE } from '../../funkoDetailUtils';
import { failWhenInvalid } from '@utils/actionUtils';
import { assertCanEditFunko } from '@utils/adminRouteUtils';

type EditFunkoFormData = { funko: UpdateFunko; collectionIds: number[] };

const COLLECTIONS_FAILED_MESSAGE = 'The details are saved, but a collection could not be changed. Please try again.';

const collectionIdsSchema = array().of(number().integer().positive().required()).required();

// Adds the funko to the newly picked collections and removes its items from the ones taken away. True when every
// change went through.
async function syncCollections(funkoId: number, collectionIds: number[]): Promise<boolean> {
  const current = await collectionItemService.getItems({
    pagination: { page: DEFAULT_FIRST_PAGE, size: FUNKO_ITEMS_PAGE_SIZE },
    [ItemApiSearchFields.FUNKO_ID]: String(funkoId),
  });
  const currentIds = current.data.map((item) => item.collection.id);
  const toAdd = collectionIds.filter((collectionId) => !currentIds.includes(collectionId));
  const toRemove = current.data.filter((item) => !collectionIds.includes(item.collection.id));

  const results = await Promise.all([
    ...toAdd.map((collectionId) => collectionItemService.addCollectionItem(collectionId, newItemPayload(funkoId))),
    ...toRemove.map((item) => collectionItemService.deleteCollectionItem(item.collection.id, item.id)),
  ]);

  return results.every((result) => result.success);
}

// PATCH /funkos/:funkoId, then the collection changes. Photos are not part of it: they change right away in the form.
// Like its loader, an admin's or the sender's of a waiting submission: a fetcher submission runs the action without
// the loader.
export const editFunkoAction = async ({
  request,
  params,
  context,
}: ActionFunctionArgs): Promise<JSONResponseUtil<FunkoApiModel>> => {
  const funkoId = Number(params.funkoId);

  assertCanEditFunko(context, await funkoService.getFunko(funkoId));

  const { funko, collectionIds } = parseFormData<EditFunkoFormData>(await request.formData());

  return failWhenInvalid(async () => {
    const validFunko = await UpdateFunkoSchema.validate(funko);
    const validCollectionIds = await collectionIdsSchema.validate(collectionIds);
    const updated = await funkoService.updateFunko(funkoId, validFunko);

    if (!updated.success) return updated;

    const isEverySynced = await syncCollections(funkoId, validCollectionIds);

    if (!isEverySynced) return { success: false, error: { message: COLLECTIONS_FAILED_MESSAGE } };

    return updated;
  });
};
