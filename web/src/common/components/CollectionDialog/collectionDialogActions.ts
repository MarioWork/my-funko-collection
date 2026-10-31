import type { ActionFunctionArgs } from 'react-router';
import type { CollectionApiModel } from '@app-types/models';
import type { JSONResponseUtil } from '@app-types/utility';
import collectionService from '@services/collectionService/collectionService';
import {
  CreateCollectionSchema,
  UpdateCollectionSchema,
  type CreateCollection,
} from '@services/collectionService/collectionService.type';
import { parseFormData } from '@utils/formDataUtils';
import { failWhenInvalid } from '@utils/actionUtils';

type CollectionFormData = { collection: CreateCollection };

// One action for both routes: an id in the URL means update, none means create.
export const saveCollectionAction = async ({
  request,
  params,
}: ActionFunctionArgs): Promise<JSONResponseUtil<CollectionApiModel>> => {
  const { collection } = parseFormData<CollectionFormData>(await request.formData());

  return failWhenInvalid(async () => {
    if (params.collectionId) {
      const valid = await UpdateCollectionSchema.validate(collection);

      return collectionService.updateCollection(Number(params.collectionId), valid);
    }

    const valid = await CreateCollectionSchema.validate(collection);

    return collectionService.addCollection(valid);
  });
};
