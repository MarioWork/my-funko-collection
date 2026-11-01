import { http } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { conflict, noContent, notFound } from '@mocks/mockResponses';
import { mockStore } from '@mocks/mockStore';

// The API's 409 in words.
const SERIES_IN_USE_MESSAGE = 'Funkos still use this series. Move them to another series first';

export default (baseUrl: string) => [
  http.delete(`${baseUrl}/series/:seriesId`, async ({ params }) => {
    await delay(MOCK_DELAY);

    const index = mockStore.series.findIndex((series) => String(series.id) === params.seriesId);

    if (index === -1) return notFound('Series', String(params.seriesId));

    // Every funko has a series, so one that any funko (a submission too) uses is refused, as the API does.
    const isInUse = mockStore.funkos.some((funko) => String(funko.seriesId) === params.seriesId);

    if (isInUse) return conflict(SERIES_IN_USE_MESSAGE);

    mockStore.series.splice(index, 1);

    return noContent();
  }),
];
