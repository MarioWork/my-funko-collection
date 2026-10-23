import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { AuthStateUtil } from '@app-types/utility';
import { MOCK_DELAY } from '@mocks/handlers';
import { errorResponse } from '@mocks/mockResponses';
import { MOCK_SETUP_CODE, mockStore } from '@mocks/mockStore';
import { AuthApiErrorCodes } from '@services/authService/authService';
import type { StartSetup } from '@services/authService/authService.type';
import { createCreationOptionsMockModel } from './models/passkeyOptionsMockModel.mock';
import { rpIdOf } from './authMockUtils';

export default (baseUrl: string) => [
  http.post(`${baseUrl}/auth/setup/options`, async ({ request }) => {
    await delay(MOCK_DELAY);

    const { code, name } = (await request.json()) as StartSetup;

    if (mockStore.auth.state !== AuthStateUtil.SETUP) {
      return errorResponse(409, AuthApiErrorCodes.ALREADY_SET_UP, 'This app is already set up.');
    }

    if (code !== MOCK_SETUP_CODE) {
      return errorResponse(401, AuthApiErrorCodes.INVALID_SETUP_CODE, 'That setup code is not valid.');
    }

    return HttpResponse.json(createCreationOptionsMockModel(rpIdOf(request), name));
  }),
];
