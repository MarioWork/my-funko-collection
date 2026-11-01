import { http } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { conflict, noContent, notFound } from '@mocks/mockResponses';
import { mockStore } from '@mocks/mockStore';

// The API's 409 in words.
const CATEGORY_IN_USE_MESSAGE = 'Funkos still use this category. Move them to another category first';

export default (baseUrl: string) => [
  http.delete(`${baseUrl}/categories/:categoryId`, async ({ params }) => {
    await delay(MOCK_DELAY);

    const index = mockStore.categories.findIndex((category) => String(category.id) === params.categoryId);

    if (index === -1) return notFound('Category', String(params.categoryId));

    // Every funko has a category, so one that any funko (a submission too) uses is refused, as the API does.
    const isInUse = mockStore.funkos.some((funko) => String(funko.categoryId) === params.categoryId);

    if (isInUse) return conflict(CATEGORY_IN_USE_MESSAGE);

    mockStore.categories.splice(index, 1);

    return noContent();
  }),
];
