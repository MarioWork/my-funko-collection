import type { ActionFunctionArgs } from 'react-router';
import type { CollectionItemApiModel } from '@app-types/models';
import type { JSONResponseUtil } from '@app-types/utility';
import collectionItemService from '@services/collectionItemService/collectionItemService';
import {
  UpdateCollectionItemSchema,
  type UpdateCollectionItem,
} from '@services/collectionItemService/collectionItemService.type';
import { parseFormData } from '@utils/formDataUtils';
import { failWhenInvalid } from '@utils/actionUtils';

type EditItemFormData = { item: UpdateCollectionItem };

export const updateItemAction = async ({
  request,
  params,
}: ActionFunctionArgs): Promise<JSONResponseUtil<CollectionItemApiModel>> => {
  const { item } = parseFormData<EditItemFormData>(await request.formData());

  return failWhenInvalid(async () => {
    const valid = await UpdateCollectionItemSchema.validate(item);

    return collectionItemService.updateCollectionItem(Number(params.collectionId), Number(params.itemId), valid);
  });
};
