import { http } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { AuthStateUtil } from '@app-types/utility';
import { MOCK_DELAY } from '@mocks/handlers';
import { noContent } from '@mocks/mockResponses';
import { mockStore } from '@mocks/mockStore';

export default (baseUrl: string) => [
  http.post(`${baseUrl}/auth/logout`, async () => {
    await delay(MOCK_DELAY);

    mockStore.auth.state = AuthStateUtil.SIGNED_OUT;

    return noContent();
  }),
];
