import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { AuthStateUtil } from '@app-types/utility';
import { MOCK_DELAY } from '@mocks/handlers';
import { errorResponse } from '@mocks/mockResponses';
import { CONFLICT_STATUS } from '@utils/httpStatusUtils';
import { mockStore } from '@mocks/mockStore';
import { AuthApiErrorCodes } from '@services/authService/authService';
import { createRequestOptionsMockModel } from './models/passkeyOptionsMockModel.mock';
import { rpIdOf } from './authMockUtils';

export default (baseUrl: string) => [
  http.post(`${baseUrl}/auth/login/options`, async ({ request }) => {
    await delay(MOCK_DELAY);

    if (mockStore.auth.state === AuthStateUtil.SETUP) {
      return errorResponse(CONFLICT_STATUS, AuthApiErrorCodes.NOT_SET_UP, 'Nobody has set up this app yet.');
    }

    return HttpResponse.json(createRequestOptionsMockModel(rpIdOf(request)));
  }),
];
