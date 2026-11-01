import { http } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { conflict, created, DUPLICATE_CONFLICT_MESSAGE, toSeriesModel } from '@mocks/mockResponses';
import { SubmissionStatusUtil } from '@app-types/utility';
import { newMockSubmissionColumns } from '@mocks/mockCatalogueUtils';
import { mockStore } from '@mocks/mockStore';
import { nextId, nowIso } from '@mocks/mockStoreUtils';
import type { CreateSeries } from '@services/seriesService/seriesService.type';

// A member typing a name the catalogue already has, as the API words it.
const IN_CATALOGUE_MESSAGE = 'This series is already in the catalogue';

export default (baseUrl: string) => [
  http.post(`${baseUrl}/series`, async ({ request }) => {
    await delay(MOCK_DELAY);

    const body = (await request.json()) as CreateSeries;
    const standing = newMockSubmissionColumns();
    const inCatalogue = mockStore.series.find(
      (series) => series.name === body.name && series.status === SubmissionStatusUtil.APPROVED,
    );
    const isMember = standing.submittedById !== null;

    // A member typing a name the catalogue has is pointed at it, as the API does.
    if (inCatalogue && isMember) return conflict(IN_CATALOGUE_MESSAGE, inCatalogue.id);

    if (inCatalogue) return conflict(DUPLICATE_CONFLICT_MESSAGE);

    const ownWaiting = mockStore.series.find(
      (series) =>
        series.name === body.name &&
        series.status === SubmissionStatusUtil.WAITING &&
        series.submittedById === standing.submittedById,
    );

    if (ownWaiting && isMember) return conflict(DUPLICATE_CONFLICT_MESSAGE);

    const row = {
      id: nextId(mockStore.series),
      name: body.name,
      ...standing,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    mockStore.series.push(row);

    return created(toSeriesModel(row));
  }),
];
