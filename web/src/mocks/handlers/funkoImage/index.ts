import addFunkoImagesHandler from './addFunkoImages.mock.handler';
import updateFunkoImagesHandler from './updateFunkoImages.mock.handler';

export const funkoImageMockHandlers = (baseUrl: string) => [
  ...addFunkoImagesHandler(baseUrl),
  ...updateFunkoImagesHandler(baseUrl),
];
