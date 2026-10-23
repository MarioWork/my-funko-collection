import { http } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { conflict, created, DUPLICATE_CONFLICT_MESSAGE, toTagModel } from '@mocks/mockResponses';
import { mockStore, nextId, nowIso } from '@mocks/mockStore';
import type { CreateTag } from '@services/tagService/tagService.type';

export default (baseUrl: string) => [
  http.post(`${baseUrl}/tags`, async ({ request }) => {
    await delay(MOCK_DELAY);

    const body = (await request.json()) as CreateTag;

    if (mockStore.tags.some((tag) => tag.name === body.name)) return conflict(DUPLICATE_CONFLICT_MESSAGE);

    const row = {
      id: nextId(mockStore.tags),
      name: body.name,
      notes: body.notes ?? null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    mockStore.tags.push(row);

    return created(toTagModel(row));
  }),
];
