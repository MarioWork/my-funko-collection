import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { notFound, toTagModel } from '@mocks/mockResponses';
import { mockStore } from '@mocks/mockStore';

export default (baseUrl: string) => [
  http.get(`${baseUrl}/tags/:tagId`, async ({ params }) => {
    await delay(MOCK_DELAY);

    const row = mockStore.tags.find((tag) => String(tag.id) === params.tagId);

    return row ? HttpResponse.json(toTagModel(row)) : notFound('Tag', String(params.tagId));
  }),
];
