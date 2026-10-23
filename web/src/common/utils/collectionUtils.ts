import { boolean, string } from 'yup';

export const COLLECTION_NAME_MAX_LENGTH = 100;
export const COLLECTION_NOTES_MAX_LENGTH = 2000;

export const collectionNameSchema = string()
  .trim()
  .required('Name is required')
  .max(COLLECTION_NAME_MAX_LENGTH, `Name must be at most ${COLLECTION_NAME_MAX_LENGTH} characters`);

export const collectionNotesSchema = string()
  .trim()
  .max(COLLECTION_NOTES_MAX_LENGTH, `Notes must be at most ${COLLECTION_NOTES_MAX_LENGTH} characters`)
  .nullable()
  .notRequired();

export const collectionIsDefaultSchema = boolean().notRequired();

// The second collection every install starts with (api/drizzle/0001_default_collections.sql), next to the default.
export const WISHLIST_COLLECTION_NAME = 'Wishlist';
