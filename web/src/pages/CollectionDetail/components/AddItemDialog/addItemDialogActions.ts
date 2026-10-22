import type { ActionFunctionArgs } from 'react-router';
import { ValidationError } from 'yup';
import type { CollectionItemApiModel } from '@app-types/models';
import type { JSONResponseUtil } from '@app-types/utility';
import collectionItemService from '@services/collectionItemService/collectionItemService';
import {
  CreateCollectionItemSchema,
  type CreateCollectionItem,
} from '@services/collectionItemService/collectionItemService.type';
import { parseFormData } from '@utils/formDataUtils';

type AddItemFormData = { item: CreateCollectionItem };

// Also the target of a removed item's Undo, which re-posts the same data here.
export const createItemAction = async ({
  request,
  params,
}: ActionFunctionArgs): Promise<JSONResponseUtil<CollectionItemApiModel>> => {
  const { item } = parseFormData<AddItemFormData>(await request.formData());

  try {
    const valid = await CreateCollectionItemSchema.validate(item);

    return await collectionItemService.addCollectionItem(Number(params.collectionId), valid);
  } catch (error) {
    if (error instanceof ValidationError) return { success: false };

    throw error;
  }
};
