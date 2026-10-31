import { http } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { conflict, created, DUPLICATE_CONFLICT_MESSAGE, toCategoryModel } from '@mocks/mockResponses';
import { SubmissionStatusUtil } from '@app-types/utility';
import { newMockSubmissionColumns } from '@mocks/mockCatalogueUtils';
import { mockStore } from '@mocks/mockStore';
import { nextId, nowIso } from '@mocks/mockStoreUtils';
import type { CreateCategory } from '@services/categoryService/categoryService.type';

export default (baseUrl: string) => [
  http.post(`${baseUrl}/categories`, async ({ request }) => {
    await delay(MOCK_DELAY);

    const body = (await request.json()) as CreateCategory;
    const standing = newMockSubmissionColumns();
    const inCatalogue = mockStore.categories.find(
      (category) => category.name === body.name && category.status === SubmissionStatusUtil.APPROVED,
    );
    const isMember = standing.submittedById !== null;

    // A member typing a name the catalogue has is pointed at it, as the API does.
    if (inCatalogue && isMember) return conflict('This category is already in the catalogue', inCatalogue.id);

    if (inCatalogue) return conflict(DUPLICATE_CONFLICT_MESSAGE);

    const ownWaiting = mockStore.categories.find(
      (category) =>
        category.name === body.name &&
        category.status === SubmissionStatusUtil.WAITING &&
        category.submittedById === standing.submittedById,
    );

    if (ownWaiting && isMember) return conflict(DUPLICATE_CONFLICT_MESSAGE);

    const row = {
      id: nextId(mockStore.categories),
      name: body.name,
      ...standing,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    mockStore.categories.push(row);

    return created(toCategoryModel(row));
  }),
];
