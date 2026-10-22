import { string } from 'yup';

export const CATEGORY_NAME_MAX_LENGTH = 100;

export const categoryNameSchema = string()
  .trim()
  .required('Name is required')
  .max(CATEGORY_NAME_MAX_LENGTH, `Name must be at most ${CATEGORY_NAME_MAX_LENGTH} characters`);
