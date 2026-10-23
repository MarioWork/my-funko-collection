import { http } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { noContent, notFound } from '@mocks/mockResponses';
import { mockStore } from '@mocks/mockStore';

export default (baseUrl: string) => [
  http.delete(`${baseUrl}/tags/:tagId`, async ({ params }) => {
    await delay(MOCK_DELAY);

    const index = mockStore.tags.findIndex((tag) => String(tag.id) === params.tagId);

    if (index === -1) return notFound('Tag', String(params.tagId));

    const [removed] = mockStore.tags.splice(index, 1);

    // Cascade: the label disappears from every item.
    for (const item of mockStore.items) item.tagIds = item.tagIds.filter((tagId) => tagId !== removed?.id);

    return noContent();
  }),
];
