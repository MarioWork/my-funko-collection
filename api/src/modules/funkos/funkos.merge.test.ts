import { combineClashingItems, type MergedItem } from './funkos.merge.ts';

const MAX_QUANTITY = 1000;
const MAX_TAGS_PER_ITEM = 20;

function item(overrides: Partial<MergedItem> = {}): MergedItem {
  return { quantity: 1, notes: null, tagIds: [], ...overrides };
}

function tagIdsFrom(first: number, count: number): number[] {
  return Array.from({ length: count }, (_, index) => first + index);
}

describe('combineClashingItems', () => {
  it('adds the quantities and joins both notes, the older first, when both items have notes', () => {
    const combined = combineClashingItems(item({ quantity: 1, notes: 'Box 3' }), item({ quantity: 2, notes: 'Gift' }));

    expect(combined).toMatchObject({ quantity: 3, notes: 'Box 3\n\nGift' });
  });

  it('keeps the one note when only one item has notes', () => {
    const combined = combineClashingItems(item({ notes: null }), item({ notes: 'Gift' }));

    expect(combined).toMatchObject({ quantity: 2, notes: 'Gift' });
  });

  it('writes the same note once when both items say the same', () => {
    const combined = combineClashingItems(item({ notes: 'Gift' }), item({ notes: 'Gift' }));

    expect(combined.notes).toBe('Gift');
  });

  it('leaves the notes empty when neither item has any, blank ones included', () => {
    const combined = combineClashingItems(item({ notes: '   ' }), item({ notes: null }));

    expect(combined.notes).toBeNull();
  });

  it('joins both items’ tags, the older item’s first, each once', () => {
    const combined = combineClashingItems(item({ tagIds: [3, 1] }), item({ tagIds: [1, 2] }));

    expect(combined.tagIds).toEqual([3, 1, 2]);
  });

  it('caps the quantity at the item limit when the two add up past it', () => {
    const combined = combineClashingItems(item({ quantity: 600 }), item({ quantity: 700 }));

    expect(combined.quantity).toBe(MAX_QUANTITY);
  });

  it('caps the tags at the item limit, keeping the older item’s and dropping the newer item’s extras', () => {
    const olderTags = tagIdsFrom(1, 15);
    const newerTags = tagIdsFrom(100, 10);

    const combined = combineClashingItems(item({ tagIds: olderTags }), item({ tagIds: newerTags }));

    expect(combined.tagIds).toEqual([...olderTags, ...tagIdsFrom(100, MAX_TAGS_PER_ITEM - olderTags.length)]);
  });
});
