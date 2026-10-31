import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { notFound, toTagModel } from '@mocks/mockResponses';
import { mockStore } from '@mocks/mockStore';
import { nowIso } from '@mocks/mockStoreUtils';
import type { UpdateTag } from '@services/tagService/tagService.type';

export default (baseUrl: string) => [
  http.patch(`${baseUrl}/tags/:tagId`, async ({ params, request }) => {
    await delay(MOCK_DELAY);

    const row = mockStore.tags.find((tag) => String(tag.id) === params.tagId);

    if (!row) return notFound('Tag', String(params.tagId));

    const body = (await request.json()) as UpdateTag;

    Object.assign(row, body, { updatedAt: nowIso() });

    return HttpResponse.json(toTagModel(row));
  }),
];
