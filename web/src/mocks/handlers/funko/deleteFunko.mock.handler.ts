import { http } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { forgetNotifiedFunkos, notifyMockFunkoRemoved } from '@mocks/handlers/notification/notificationMockUtils';
import { MOCK_USER_ID } from '@mocks/mockAuth';
import { mockHolderIdsOf } from '@mocks/mockCatalogueUtils';
import { isTrueParam } from '@mocks/mockListUtils';
import { badRequest, inCollections, noContent } from '@mocks/mockResponses';
import { mockStore } from '@mocks/mockStore';
import type { MockFunkoRow } from '@mocks/mockStore.type';
import { FORCE_PARAM } from '@services/funkoService/funkoService';
import { findEditableFunko } from './funkoMockUtils';

const REASON_NEEDED_MESSAGE = 'Removing a funko other users have needs a reason to tell them';

type RemovalBody = { reason?: unknown };

// The signed-in user's own collections by name, every other user only as a number, as the API words its 409.
function inCollectionsMessage(funkoId: number, otherHolderCount: number): string {
  const ownCollectionIds = new Set(
    mockStore.items.filter((item) => item.funkoId === funkoId).map((item) => item.collectionId),
  );
  const places = mockStore.collections
    .filter((collection) => ownCollectionIds.has(collection.id))
    .map((collection) => `"${collection.name}"`);
  const otherUsers = otherHolderCount === 1 ? '1 other user' : `${otherHolderCount} other users`;

  if (otherHolderCount > 0) places.push(`the collections of ${otherUsers}`);

  const howToForce = otherHolderCount > 0 ? 'force=true and a reason' : 'force=true';

  return `The funko is in ${places.join(', ')}. Send ${howToForce} to remove it from them and delete it`;
}

// The trimmed reason in the body, if it carries one that is not blank.
async function reasonOf(request: Request): Promise<string | undefined> {
  const text = await request.text();

  if (!text) return undefined;

  const body = JSON.parse(text) as RemovalBody;
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';

  return reason || undefined;
}

function deleteRows(row: MockFunkoRow): void {
  mockStore.items = mockStore.items.filter((item) => item.funkoId !== row.id);
  mockStore.otherUsersItems = mockStore.otherUsersItems.filter((item) => item.funkoId !== row.id);
  mockStore.images = mockStore.images.filter((image) => image.funkoId !== row.id);
  mockStore.funkos.splice(mockStore.funkos.indexOf(row), 1);
  forgetNotifiedFunkos(new Set([row.id]));
}

// An admin deletes any funko; a member only their own submission. In anyone's collection it needs force=true, and
// taking it from other users needs a reason: each user who had it is told why.
export default (baseUrl: string) => [
  http.delete(`${baseUrl}/funkos/:funkoId`, async ({ params, request }) => {
    await delay(MOCK_DELAY);

    const target = findEditableFunko(String(params.funkoId));

    if ('refusal' in target) return target.refusal;

    const row = target.funko;
    const isForced = isTrueParam(new URL(request.url).searchParams.get(FORCE_PARAM));
    const holderIds = mockHolderIdsOf(row.id);
    const otherHolderCount = holderIds.filter((holderId) => holderId !== MOCK_USER_ID).length;
    const reason = await reasonOf(request);

    if (holderIds.length > 0 && !isForced) {
      return inCollections(inCollectionsMessage(row.id, otherHolderCount), holderIds.length);
    }

    if (otherHolderCount > 0 && !reason) return badRequest(REASON_NEEDED_MESSAGE);

    deleteRows(row);

    if (otherHolderCount > 0 && reason) notifyMockFunkoRemoved(holderIds, row.name, reason);

    return noContent();
  }),
];
