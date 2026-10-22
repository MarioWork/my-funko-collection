import addFunkoHandler from './addFunko.mock.handler';
import deleteFunkoHandler from './deleteFunko.mock.handler';
import getFunkoHandler from './getFunko.mock.handler';
import listFunkosHandler from './listFunkos.mock.handler';
import updateFunkoHandler from './updateFunko.mock.handler';

export const funkoMockHandlers = (baseUrl: string) => [
  ...listFunkosHandler(baseUrl),
  ...getFunkoHandler(baseUrl),
  ...addFunkoHandler(baseUrl),
  ...updateFunkoHandler(baseUrl),
  ...deleteFunkoHandler(baseUrl),
];
