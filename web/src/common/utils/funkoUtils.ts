import { boolean, number, string } from 'yup';
import { FunkoTypeUtil } from '@app-types/utility';

const FUNKO_NAME_MAX_LENGTH = 150;
const FUNKO_NUMBER_MAX_LENGTH = 20;
const FUNKO_EXCLUSIVE_MAX_LENGTH = 100;
const BARCODE_MIN_LENGTH = 8;
const BARCODE_MAX_LENGTH = 14;
const BARCODE_PATTERN = /^\d+$/;

export const funkoNameSchema = string()
  .trim()
  .required('Name is required')
  .max(FUNKO_NAME_MAX_LENGTH, `Name must be at most ${FUNKO_NAME_MAX_LENGTH} characters`);

export const funkoNumberSchema = string()
  .trim()
  .required('Number is required')
  .max(FUNKO_NUMBER_MAX_LENGTH, `Number must be at most ${FUNKO_NUMBER_MAX_LENGTH} characters`);

export const funkoTypeSchema = string<FunkoTypeUtil>()
  .oneOf(Object.values(FunkoTypeUtil), 'Pick a type')
  .required('Type is required');

// Optional: null means "no series".
export const funkoSeriesIdSchema = number().integer().positive().nullable().defined().default(null);

export const FUNKO_CATEGORY_REQUIRED_MESSAGE = 'Category is required';

export const funkoCategoryIdSchema = number()
  .typeError('Pick a category')
  .integer()
  .positive('Pick a category')
  .required(FUNKO_CATEGORY_REQUIRED_MESSAGE);

export const funkoIsChaseSchema = boolean().required();

export const funkoExclusiveSchema = string()
  .trim()
  .max(FUNKO_EXCLUSIVE_MAX_LENGTH, `Exclusive must be at most ${FUNKO_EXCLUSIVE_MAX_LENGTH} characters`)
  .defined()
  .default('');

// Empty means "no barcode"; the form turns '' into null before it reaches the service.
export const funkoBarcodeSchema = string()
  .trim()
  .matches(BARCODE_PATTERN, { message: 'Only digits', excludeEmptyString: true })
  .test('barcode-length', `Between ${BARCODE_MIN_LENGTH} and ${BARCODE_MAX_LENGTH} digits`, (value) => {
    if (!value) return true;

    return value.length >= BARCODE_MIN_LENGTH && value.length <= BARCODE_MAX_LENGTH;
  })
  .nullable()
  .notRequired();
