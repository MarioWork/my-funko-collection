import { http } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { NotificationKindUtil, SubmissionStatusUtil } from '@app-types/utility';
import { MOCK_DELAY } from '@mocks/handlers';
import { notifyMockAdmins } from '@mocks/handlers/notification/notificationMockUtils';
import { newMockSubmissionColumns } from '@mocks/mockCatalogueUtils';
import { conflict, created, toFunkoModel } from '@mocks/mockResponses';
import { mockStore } from '@mocks/mockStore';
import type { MockFunkoRow } from '@mocks/mockStore.type';
import { nextId, NOT_REVIEWED, nowIso } from '@mocks/mockStoreUtils';
import type { CreateFunko } from '@services/funkoService/funkoService.type';
import {
  DUPLICATE_BARCODE_MESSAGE,
  DUPLICATE_FUNKO_MESSAGE,
  findBarcodeTwin,
  findDuplicate,
  missingSeriesRefusal,
  referenceRefusal,
} from './funkoMockUtils';

// An admin's new funko joins the catalogue; a member's is a waiting submission only they see, and every admin is told.
export default (baseUrl: string) => [
  http.post(`${baseUrl}/funkos`, async ({ request }) => {
    await delay(MOCK_DELAY);

    const body = (await request.json()) as CreateFunko;
    const missingSeries = missingSeriesRefusal(body.seriesId);

    if (missingSeries) return missingSeries;

    const row: MockFunkoRow = {
      id: nextId(mockStore.funkos),
      name: body.name,
      number: body.number,
      type: body.type,
      categoryId: body.categoryId,
      seriesId: body.seriesId,
      isChase: body.isChase,
      exclusive: body.exclusive,
      barcode: body.barcode ?? null,
      ...newMockSubmissionColumns(),
      ...NOT_REVIEWED,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    const refusal = referenceRefusal(row);

    if (refusal) return refusal;

    const duplicate = findDuplicate(row);

    if (duplicate) return conflict(DUPLICATE_FUNKO_MESSAGE, duplicate.id);

    const sameBarcode = findBarcodeTwin(row);

    if (sameBarcode) return conflict(DUPLICATE_BARCODE_MESSAGE, sameBarcode.id);

    mockStore.funkos.push(row);

    if (row.status === SubmissionStatusUtil.WAITING) notifyMockAdmins(NotificationKindUtil.SUBMISSION_SENT, row);

    return created(toFunkoModel(row));
  }),
];
