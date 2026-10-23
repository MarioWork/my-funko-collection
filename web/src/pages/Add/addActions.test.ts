import { http, HttpResponse } from 'msw/http';
import type { ActionFunctionArgs } from 'react-router';
import { FunkoTypeUtil } from '@app-types/utility';
import { mockStore } from '@mocks/mockStore';
import { server, TEST_BASE_API_URL } from '@mocks/server';
import { createFormData } from '@utils/formDataUtils';
import { PHOTO_FIELD } from '@utils/pendingPhotoUtils';
import { addFunkoAction } from './addActions';
import { AddIntentUtil } from './addUtils';

const NEW_FUNKO_NAME = 'Bulbasaur';
const OWNED_ID = 1;
const SERVER_ERROR_STATUS = 500;

function failWith500() {
  return HttpResponse.json(
    { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
    { status: SERVER_ERROR_STATUS },
  );
}

// The Add form's create submission: one new funko, one photo, filed in Owned.
async function submitNewFunko() {
  const [category] = mockStore.categories;
  const formData = createFormData({
    intent: AddIntentUtil.CREATE,
    funko: { name: NEW_FUNKO_NAME, number: '1', type: FunkoTypeUtil.POP, categoryId: category?.id, isChase: false },
    destination: { collectionIds: [OWNED_ID], tagIds: [] },
  });
  formData.append(PHOTO_FIELD, new File([new Uint8Array([1, 2, 3])], 'front.png', { type: 'image/png' }));
  const request = new Request('http://localhost/add', { method: 'POST', body: formData });

  return addFunkoAction({ request, params: {} } as ActionFunctionArgs);
}

function isNewFunkoStored() {
  return mockStore.funkos.some((funko) => funko.name === NEW_FUNKO_NAME);
}

it('saves the funko, its photo and its list when every step goes through', async () => {
  const result = await submitNewFunko();

  expect(result.success).toBe(true);
  expect(result.data?.funko.collections.map((collection) => collection.id)).toEqual([OWNED_ID]);
});

it('deletes the new funko again and says why when the photo upload fails', async () => {
  server.use(http.post(`${TEST_BASE_API_URL}/funkos/:funkoId/images`, failWith500));

  const result = await submitNewFunko();

  // The server's own reason is shown when it gives one.
  expect(result).toMatchObject({ success: false, error: { message: 'Something went wrong' } });
  expect(isNewFunkoStored()).toBe(false);
});

it('deletes the new funko again when it cannot be filed in a list', async () => {
  server.use(http.post(`${TEST_BASE_API_URL}/collections/:collectionId/items`, failWith500));

  const result = await submitNewFunko();

  expect(result.success).toBe(false);
  expect(result.error?.message).toContain('nothing was saved');
  expect(isNewFunkoStored()).toBe(false);
});

it('points at the half-saved funko when even the undo fails', async () => {
  server.use(
    http.post(`${TEST_BASE_API_URL}/collections/:collectionId/items`, failWith500),
    http.delete(`${TEST_BASE_API_URL}/funkos/:funkoId`, failWith500),
  );

  const result = await submitNewFunko();
  const halfSaved = mockStore.funkos.find((funko) => funko.name === NEW_FUNKO_NAME);

  expect(halfSaved).toBeDefined();
  expect(result).toMatchObject({ success: false, error: { existingId: halfSaved?.id } });
});
