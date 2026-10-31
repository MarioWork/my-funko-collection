import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { AuthStatusApiModel } from '@app-types/models';
import { AuthStateUtil } from '@app-types/utility';
import { MOCK_DELAY } from '@mocks/handlers';
import { mockStore } from '@mocks/mockStore';
import { mockUserOf } from './authMockUtils';

export default (baseUrl: string) => [
  http.get(`${baseUrl}/auth/status`, async (): Promise<HttpResponse<AuthStatusApiModel>> => {
    await delay(MOCK_DELAY);

    const { state } = mockStore.auth;
    const isSignedIn = state === AuthStateUtil.SIGNED_IN;

    return HttpResponse.json(isSignedIn ? { state, user: mockUserOf(mockStore.auth) } : { state });
  }),
];
