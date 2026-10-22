import type { ActionFunctionArgs } from 'react-router';
import { ValidationError } from 'yup';
import type { CollectionItemApiModel } from '@app-types/models';
import type { JSONResponseUtil } from '@app-types/utility';
import collectionItemService from '@services/collectionItemService/collectionItemService';
import {
  UpdateCollectionItemSchema,
  type UpdateCollectionItem,
} from '@services/collectionItemService/collectionItemService.type';
import { parseFormData } from '@utils/formDataUtils';

type EditItemFormData = { item: UpdateCollectionItem };

export const updateItemAction = async ({
  request,
  params,
}: ActionFunctionArgs): Promise<JSONResponseUtil<CollectionItemApiModel>> => {
  const { item } = parseFormData<EditItemFormData>(await request.formData());

  try {
    const valid = await UpdateCollectionItemSchema.validate(item);

    return await collectionItemService.updateCollectionItem(Number(params.collectionId), Number(params.itemId), valid);
  } catch (error) {
    if (error instanceof ValidationError) return { success: false };

    throw error;
  }
};
