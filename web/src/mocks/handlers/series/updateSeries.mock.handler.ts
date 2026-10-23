import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { notFound, toSeriesModel } from '@mocks/mockResponses';
import { mockStore, nowIso } from '@mocks/mockStore';
import type { UpdateSeries } from '@services/seriesService/seriesService.type';

export default (baseUrl: string) => [
  http.patch(`${baseUrl}/series/:seriesId`, async ({ params, request }) => {
    await delay(MOCK_DELAY);

    const row = mockStore.series.find((series) => String(series.id) === params.seriesId);

    if (!row) return notFound('Series', String(params.seriesId));

    const body = (await request.json()) as UpdateSeries;

    Object.assign(row, body, { updatedAt: nowIso() });

    return HttpResponse.json(toSeriesModel(row));
  }),
];
