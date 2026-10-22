import addCollectionHandler from './addCollection.mock.handler';
import deleteCollectionHandler from './deleteCollection.mock.handler';
import getCollectionHandler from './getCollection.mock.handler';
import listCollectionsHandler from './listCollections.mock.handler';
import updateCollectionHandler from './updateCollection.mock.handler';

export const collectionMockHandlers = (baseUrl: string) => [
  ...listCollectionsHandler(baseUrl),
  ...getCollectionHandler(baseUrl),
  ...addCollectionHandler(baseUrl),
  ...updateCollectionHandler(baseUrl),
  ...deleteCollectionHandler(baseUrl),
];
