import { render, renderRoutes, screen, userEvent, waitFor } from '@test-utils';
import { collectionRoutes } from '@application/routes/featureRoutes/collectionRoutes';
import { COLLECTION_ROUTES_PATHS } from '@application/routes/routesUtils';
import { Toaster } from '@components/ui/toast';
import { mockStore } from '@mocks/mockStore';
import type { MockItemRow } from '@mocks/mockStore.type';

// The fields Undo must bring back; ids and dates are the server's to set again.
function savedFields({
  quantity,
  condition,
  purchasePriceCents,
  purchaseCurrency,
  purchasedAt,
  notes,
  tagIds,
}: MockItemRow) {
  return { quantity, condition, purchasePriceCents, purchaseCurrency, purchasedAt, notes, tagIds };
}

// An Owned item with notes and tags, whose funko name appears once in Owned (its ⋯ button is then unambiguous).
function richOwnedItem() {
  const owned = mockStore.collections.find((collection) => collection.isDefault);
  const ownedItems = mockStore.items.filter((item) => item.collectionId === owned?.id);
  const nameOf = (item: MockItemRow) => mockStore.funkos.find((funko) => funko.id === item.funkoId)?.name ?? '';
  const isUniqueName = (item: MockItemRow) => ownedItems.filter((other) => nameOf(other) === nameOf(item)).length === 1;
  const item = ownedItems.find(
    (candidate) => candidate.notes && candidate.tagIds.length > 0 && isUniqueName(candidate),
  );

  if (!owned || !item) throw new Error('The mock seed has no such Owned item');

  return { collectionId: owned.id, item, funkoName: nameOf(item) };
}

it('puts a removed item back with all its details when Undo is pressed', async () => {
  const { collectionId, item, funkoName } = richOwnedItem();
  render(<Toaster />);
  renderRoutes(collectionRoutes, { initialEntries: [COLLECTION_ROUTES_PATHS.detail(String(collectionId))] });

  await userEvent.click(await screen.findByRole('button', { name: `Actions for ${funkoName}` }));
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Remove' }));
  await userEvent.click(await screen.findByRole('button', { name: 'Undo' }));

  await waitFor(() =>
    expect(
      mockStore.items.filter((row) => row.collectionId === collectionId && row.funkoId === item.funkoId),
    ).toHaveLength(1),
  );
  const restored = mockStore.items.find((row) => row.collectionId === collectionId && row.funkoId === item.funkoId);
  expect(restored && savedFields(restored)).toEqual(savedFields(item));
});
