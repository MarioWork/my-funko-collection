import type { ActionFunctionArgs } from 'react-router';
import type { JSONResponseUtil } from '@app-types/utility';
import collectionService from '@services/collectionService/collectionService';

export const deleteCollectionAction = async ({ params }: ActionFunctionArgs): Promise<JSONResponseUtil> =>
  collectionService.deleteCollection(Number(params.collectionId));

export const setDefaultCollectionAction = async ({ params }: ActionFunctionArgs): Promise<JSONResponseUtil> =>
  collectionService.updateCollection(Number(params.collectionId), { isDefault: true });
