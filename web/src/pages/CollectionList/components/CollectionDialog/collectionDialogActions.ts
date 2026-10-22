import type { ActionFunctionArgs } from 'react-router';
import { ValidationError } from 'yup';
import type { CollectionApiModel } from '@app-types/models';
import type { JSONResponseUtil } from '@app-types/utility';
import collectionService from '@services/collectionService/collectionService';
import {
  CreateCollectionSchema,
  UpdateCollectionSchema,
  type CreateCollection,
} from '@services/collectionService/collectionService.type';
import { parseFormData } from '@utils/formDataUtils';

type CollectionFormData = { collection: CreateCollection };

// One action for both routes: an id in the URL means update, none means create.
export const saveCollectionAction = async ({
  request,
  params,
}: ActionFunctionArgs): Promise<JSONResponseUtil<CollectionApiModel>> => {
  const { collection } = parseFormData<CollectionFormData>(await request.formData());

  try {
    if (params.collectionId) {
      const valid = await UpdateCollectionSchema.validate(collection);

      return await collectionService.updateCollection(Number(params.collectionId), valid);
    }

    const valid = await CreateCollectionSchema.validate(collection);

    return await collectionService.addCollection(valid);
  } catch (error) {
    if (error instanceof ValidationError) return { success: false };

    throw error;
  }
};
