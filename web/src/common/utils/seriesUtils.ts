import { string } from 'yup';

export const SERIES_NAME_MAX_LENGTH = 100;

export const seriesNameSchema = string()
  .trim()
  .required('Name is required')
  .max(SERIES_NAME_MAX_LENGTH, `Name must be at most ${SERIES_NAME_MAX_LENGTH} characters`);
