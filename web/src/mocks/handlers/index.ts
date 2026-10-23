import { categoryMockHandlers } from './category';
import { seriesMockHandlers } from './series';
import { collectionMockHandlers } from './collection';
import { collectionItemMockHandlers } from './collectionItem';
import { exportMockHandlers } from './export';
import { funkoMockHandlers } from './funko';
import { funkoImageMockHandlers } from './funkoImage';
import { statsMockHandlers } from './stats';
import { suggestMockHandlers } from './suggest';
import { tagMockHandlers } from './tag';

// Long enough to show loading states in local dev, short enough not to slow the tests.
const MOCK_DELAY = 200;

export const getHandlers = (baseUrl: string) => [
  ...categoryMockHandlers(baseUrl),
  ...seriesMockHandlers(baseUrl),
  ...tagMockHandlers(baseUrl),
  ...funkoMockHandlers(baseUrl),
  ...funkoImageMockHandlers(baseUrl),
  ...collectionMockHandlers(baseUrl),
  ...collectionItemMockHandlers(baseUrl),
  ...suggestMockHandlers(baseUrl),
  ...statsMockHandlers(baseUrl),
  ...exportMockHandlers(baseUrl),
];

export { MOCK_DELAY };
