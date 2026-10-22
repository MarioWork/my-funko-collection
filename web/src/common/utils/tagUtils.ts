import { string } from 'yup';

export const TAG_NAME_MAX_LENGTH = 100;
export const TAG_NOTES_MAX_LENGTH = 2000;

export const tagNameSchema = string()
  .trim()
  .required('Name is required')
  .max(TAG_NAME_MAX_LENGTH, `Name must be at most ${TAG_NAME_MAX_LENGTH} characters`);

export const tagNotesSchema = string()
  .trim()
  .max(TAG_NOTES_MAX_LENGTH, `Notes must be at most ${TAG_NOTES_MAX_LENGTH} characters`)
  .nullable()
  .notRequired();
