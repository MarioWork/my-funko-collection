// Merging a submission into a catalogue funko (docs/GLOSSARY.md "Merge"): what becomes of two items of the same
// funko in one collection, once the submission's item moves onto the catalogue funko. The funkos repository runs it
// inside the merge's transaction; the rule itself lives here, beside the service.
import { MAX_QUANTITY, MAX_TAGS_PER_ITEM } from '../collections/items/collectionItems.type.ts';

const NOTES_SEPARATOR = '\n\n';

// What the rule reads of each of the two items, and what the kept (older) item ends up with; every other field stays
// the older item's own. `tagIds` in the order the item got them.
export type MergedItem = {
  quantity: number;
  notes: string | null;
  tagIds: number[];
};

export type ItemCombiner = (older: MergedItem, newer: MergedItem) => MergedItem;

// Both notes, the older first, each once; null when neither has any.
function joinNotes(olderNotes: string | null, newerNotes: string | null): string | null {
  const notes = [olderNotes, newerNotes].filter((note): note is string => note !== null && note.trim().length > 0);
  const distinctNotes = [...new Set(notes)];

  if (distinctNotes.length === 0) return null;

  return distinctNotes.join(NOTES_SEPARATOR);
}

// Both items' tags, the older item's first, each once, up to the item limit: the newer item's extras are dropped.
function joinTagIds(olderTagIds: number[], newerTagIds: number[]): number[] {
  const distinctTagIds = [...new Set([...olderTagIds, ...newerTagIds])];

  return distinctTagIds.slice(0, MAX_TAGS_PER_ITEM);
}

// Doubles raise the quantity, never make a second item: the quantities add up and the notes and tags are joined. The
// result keeps to the item limits (MAX_QUANTITY, MAX_TAGS_PER_ITEM), so the member can still edit it afterwards.
export const combineClashingItems: ItemCombiner = (older, newer) => ({
  quantity: Math.min(older.quantity + newer.quantity, MAX_QUANTITY),
  notes: joinNotes(older.notes, newer.notes),
  tagIds: joinTagIds(older.tagIds, newer.tagIds),
});
