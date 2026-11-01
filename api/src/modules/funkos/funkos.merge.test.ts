import { combineClashingItems } from './funkos.merge.ts';

describe('combineClashingItems', () => {
  it('adds the quantities and joins both notes, the older first, when both items have notes', () => {
    const combined = combineClashingItems({ quantity: 1, notes: 'Box 3' }, { quantity: 2, notes: 'Gift' });

    expect(combined).toEqual({ quantity: 3, notes: 'Box 3\n\nGift' });
  });

  it('keeps the one note when only one item has notes', () => {
    const combined = combineClashingItems({ quantity: 1, notes: null }, { quantity: 1, notes: 'Gift' });

    expect(combined).toEqual({ quantity: 2, notes: 'Gift' });
  });

  it('writes the same note once when both items say the same', () => {
    const combined = combineClashingItems({ quantity: 1, notes: 'Gift' }, { quantity: 1, notes: 'Gift' });

    expect(combined.notes).toBe('Gift');
  });

  it('leaves the notes empty when neither item has any, blank ones included', () => {
    const combined = combineClashingItems({ quantity: 1, notes: '   ' }, { quantity: 1, notes: null });

    expect(combined.notes).toBeNull();
  });
});
