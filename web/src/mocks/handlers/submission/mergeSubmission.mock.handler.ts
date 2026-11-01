import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { SubmissionStatusUtil } from '@app-types/utility';
import { MOCK_DELAY } from '@mocks/handlers';
import { notifyMockSenderOfMerge } from '@mocks/handlers/notification/notificationMockUtils';
import { badRequest } from '@mocks/mockResponses';
import { mockStore } from '@mocks/mockStore';
import type { MockFunkoRow, MockItemRow } from '@mocks/mockStore.type';
import { nowIso } from '@mocks/mockStoreUtils';
import type { MergeSubmission } from '@services/submissionService/submissionService.type';
import { MAX_QUANTITY, MAX_TAGS_PER_ITEM } from '@utils/itemUtils';
import { findWaitingSubmission, toSubmissionModel } from './submissionMockUtils';

// The API's answers, word for word where the page shows them.
const SELF_MERGE_MESSAGE = 'A submission cannot be merged into itself';
// What the API's schema check answers to a body with no target.
const NO_TARGET_MESSAGE = 'Request validation failed';
const NOTES_SEPARATOR = '\n\n';

function notInCatalogueMessage(targetId: number): string {
  return `Funko ${targetId} is not in the catalogue`;
}

function isOlder(first: MockItemRow, second: MockItemRow): boolean {
  const isSameTime = first.createdAt === second.createdAt;

  return first.createdAt < second.createdAt || (isSameTime && first.id < second.id);
}

// Both notes, the older first, each once; null when neither has any (api/src/modules/funkos/funkos.merge.ts).
function joinNotes(olderNotes: string | null, newerNotes: string | null): string | null {
  const notes = [olderNotes, newerNotes].filter((note): note is string => note !== null && note.trim().length > 0);
  const distinctNotes = [...new Set(notes)];

  return distinctNotes.length === 0 ? null : distinctNotes.join(NOTES_SEPARATOR);
}

// Two items of the target in one collection become the older one, as the API does: quantities added, notes and tags
// joined (the older item's tags first), within the item limits, its other fields its own. The newer one goes.
function combineItems(moving: MockItemRow, staying: MockItemRow, targetId: number): void {
  const [older, newer] = isOlder(moving, staying) ? [moving, staying] : [staying, moving];

  Object.assign(older, {
    funkoId: targetId,
    quantity: Math.min(older.quantity + newer.quantity, MAX_QUANTITY),
    notes: joinNotes(older.notes, newer.notes),
    tagIds: [...new Set([...older.tagIds, ...newer.tagIds])].slice(0, MAX_TAGS_PER_ITEM),
    updatedAt: nowIso(),
  });
  mockStore.items = mockStore.items.filter((item) => item.id !== newer.id);
}

// Every item of the submission moves onto the target, or combines with the target's item in its collection.
function moveItems(submission: MockFunkoRow, target: MockFunkoRow): void {
  const movingItems = mockStore.items.filter((item) => item.funkoId === submission.id);

  for (const moving of movingItems) {
    const staying = mockStore.items.find(
      (item) => item.collectionId === moving.collectionId && item.funkoId === target.id,
    );

    if (staying) {
      combineItems(moving, staying, target.id);
    } else {
      Object.assign(moving, { funkoId: target.id, updatedAt: nowIso() });
    }
  }
}

function findCatalogueFunko(targetId: number): MockFunkoRow | undefined {
  return mockStore.funkos.find((funko) => funko.id === targetId && funko.status === SubmissionStatusUtil.APPROVED);
}

// Merging a waiting submission into a catalogue funko (admins only: requireAdmin refuses members first), like the
// API: the items move, the submission reads as merged into the target, and its sender is told.
export default (baseUrl: string) => [
  http.post(`${baseUrl}/submissions/:funkoId/merge`, async ({ params, request }) => {
    await delay(MOCK_DELAY);

    const { targetFunkoId } = (await request.json()) as Partial<MergeSubmission>;

    if (typeof targetFunkoId !== 'number') return badRequest(NO_TARGET_MESSAGE);

    if (String(targetFunkoId) === String(params.funkoId)) return badRequest(SELF_MERGE_MESSAGE);

    const lookup = findWaitingSubmission(String(params.funkoId));

    if ('refusal' in lookup) return lookup.refusal;

    const target = findCatalogueFunko(targetFunkoId);

    if (!target) return badRequest(notInCatalogueMessage(targetFunkoId));

    moveItems(lookup.funko, target);
    Object.assign(lookup.funko, {
      status: SubmissionStatusUtil.MERGED,
      mergedIntoId: target.id,
      reviewedAt: nowIso(),
      updatedAt: nowIso(),
    });
    notifyMockSenderOfMerge(lookup.funko, target);

    return HttpResponse.json(toSubmissionModel(lookup.funko));
  }),
];
