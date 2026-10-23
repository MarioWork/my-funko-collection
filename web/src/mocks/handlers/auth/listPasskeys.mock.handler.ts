import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { PasskeyListApiModel } from '@app-types/models';
import { MOCK_DELAY } from '@mocks/handlers';
import { mockStore } from '@mocks/mockStore';

// Newest first, as the API lists them.
export default (baseUrl: string) => [
  http.get(`${baseUrl}/auth/passkeys`, async (): Promise<HttpResponse<PasskeyListApiModel>> => {
    await delay(MOCK_DELAY);

    const newestFirst = [...mockStore.auth.passkeys].sort((first, second) =>
      second.createdAt.localeCompare(first.createdAt),
    );

    return HttpResponse.json({ data: newestFirst });
  }),
];
