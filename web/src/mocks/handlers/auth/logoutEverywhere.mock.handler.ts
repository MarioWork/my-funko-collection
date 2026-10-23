import { http } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { AuthStateUtil } from '@app-types/utility';
import { MOCK_DELAY } from '@mocks/handlers';
import { mockStore } from '@mocks/mockStore';
import { noContent } from './authMockUtils';

// One browser in the mocks, so "every session" is this one.
export default (baseUrl: string) => [
  http.post(`${baseUrl}/auth/logout-everywhere`, async () => {
    await delay(MOCK_DELAY);

    mockStore.auth.state = AuthStateUtil.SIGNED_OUT;

    return noContent();
  }),
];
