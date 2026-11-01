// Merging a submission into a catalogue funko (docs/GLOSSARY.md "Merge"): what becomes of two items of the same
// funko in one collection, once the submission's item moves onto the catalogue funko. The funkos repository runs it
// inside the merge's transaction; the rule itself lives here, beside the service.

const NOTES_SEPARATOR = '\n\n';

// What the rule reads of each of the two items, and what the kept (older) item ends up with. Its tags become both
// items' tags; every other field stays its own.
export type ItemQuantityAndNotes = {
  quantity: number;
  notes: string | null;
};

export type ItemCombiner = (older: ItemQuantityAndNotes, newer: ItemQuantityAndNotes) => ItemQuantityAndNotes;

// Both notes, the older first, each once; null when neither has any.
function joinNotes(olderNotes: string | null, newerNotes: string | null): string | null {
  const notes = [olderNotes, newerNotes].filter((note): note is string => note !== null && note.trim().length > 0);
  const distinctNotes = [...new Set(notes)];

  if (distinctNotes.length === 0) return null;

  return distinctNotes.join(NOTES_SEPARATOR);
}

// Doubles raise the quantity, never make a second item: the quantities add up and the notes are joined.
export const combineClashingItems: ItemCombiner = (older, newer) => ({
  quantity: older.quantity + newer.quantity,
  notes: joinNotes(older.notes, newer.notes),
});
