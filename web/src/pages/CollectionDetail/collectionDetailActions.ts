import type { ActionFunctionArgs } from 'react-router';
import type { CollectionItemApiModel } from '@app-types/models';
import type { JSONResponseUtil } from '@app-types/utility';
import collectionItemService from '@services/collectionItemService/collectionItemService';
import {
  CreateCollectionItemSchema,
  MoveCollectionItemSchema,
  type CreateCollectionItem,
  type MoveCollectionItem,
} from '@services/collectionItemService/collectionItemService.type';
import { parseFormData } from '@utils/formDataUtils';
import { failWhenInvalid } from '@utils/actionUtils';

export const moveItemAction = async ({ request, params }: ActionFunctionArgs): Promise<JSONResponseUtil> => {
  const data = parseFormData<MoveCollectionItem>(await request.formData());

  return failWhenInvalid(async () => {
    const valid = await MoveCollectionItemSchema.validate(data);

    return collectionItemService.moveCollectionItem(Number(params.collectionId), Number(params.itemId), valid);
  });
};

export const deleteItemAction = async ({ params }: ActionFunctionArgs): Promise<JSONResponseUtil> =>
  collectionItemService.deleteCollectionItem(Number(params.collectionId), Number(params.itemId));

type RestoreItemFormData = { item: CreateCollectionItem };

// A removed item's Undo: re-posts the item's own data to put it back. Items are never created here otherwise; a
// funko goes into a collection from the Add flow or its own page.
export const restoreItemAction = async ({
  request,
  params,
}: ActionFunctionArgs): Promise<JSONResponseUtil<CollectionItemApiModel>> => {
  const { item } = parseFormData<RestoreItemFormData>(await request.formData());

  return failWhenInvalid(async () => {
    const valid = await CreateCollectionItemSchema.validate(item);

    return collectionItemService.addCollectionItem(Number(params.collectionId), valid);
  });
};
