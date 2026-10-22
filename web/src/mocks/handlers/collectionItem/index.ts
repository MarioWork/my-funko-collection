import addCollectionItemHandler from './addCollectionItem.mock.handler';
import getCollectionItemHandler from './getCollectionItem.mock.handler';
import listCollectionItemsHandler from './listCollectionItems.mock.handler';
import updateCollectionItemHandler from './updateCollectionItem.mock.handler';

export const collectionItemMockHandlers = (baseUrl: string) => [
  ...listCollectionItemsHandler(baseUrl),
  ...getCollectionItemHandler(baseUrl),
  ...addCollectionItemHandler(baseUrl),
  ...updateCollectionItemHandler(baseUrl),
];
