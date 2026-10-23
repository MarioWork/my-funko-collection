import listImageGroupsHandler from './listImageGroups.mock.handler';
import listImagesHandler from './listImages.mock.handler';

export const imageMockHandlers = (baseUrl: string) => [
  ...listImageGroupsHandler(baseUrl),
  ...listImagesHandler(baseUrl),
];
