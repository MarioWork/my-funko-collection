import { http } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { conflict, created, DUPLICATE_CONFLICT_MESSAGE, toSeriesModel } from '@mocks/mockResponses';
import { mockStore, nextId, nowIso } from '@mocks/mockStore';
import type { CreateSeries } from '@services/seriesService/seriesService.type';

export default (baseUrl: string) => [
  http.post(`${baseUrl}/series`, async ({ request }) => {
    await delay(MOCK_DELAY);

    const body = (await request.json()) as CreateSeries;
    const existing = mockStore.series.find((series) => series.name === body.name);

    if (existing) return conflict(DUPLICATE_CONFLICT_MESSAGE);

    const row = { id: nextId(mockStore.series), name: body.name, createdAt: nowIso(), updatedAt: nowIso() };

    mockStore.series.push(row);

    return created(toSeriesModel(row));
  }),
];
