import type { ActionFunctionArgs } from 'react-router';
import { ValidationError } from 'yup';
import type { JSONResponseUtil } from '@app-types/utility';
import collectionItemService from '@services/collectionItemService/collectionItemService';
import {
  MoveCollectionItemSchema,
  type MoveCollectionItem,
} from '@services/collectionItemService/collectionItemService.type';
import { parseFormData } from '@utils/formDataUtils';

export const moveItemAction = async ({ request, params }: ActionFunctionArgs): Promise<JSONResponseUtil> => {
  const data = parseFormData<MoveCollectionItem>(await request.formData());

  try {
    const valid = await MoveCollectionItemSchema.validate(data);

    return await collectionItemService.moveCollectionItem(Number(params.collectionId), Number(params.itemId), valid);
  } catch (error) {
    if (error instanceof ValidationError) return { success: false };

    throw error;
  }
};

export const deleteItemAction = async ({ params }: ActionFunctionArgs): Promise<JSONResponseUtil> =>
  collectionItemService.deleteCollectionItem(Number(params.collectionId), Number(params.itemId));
