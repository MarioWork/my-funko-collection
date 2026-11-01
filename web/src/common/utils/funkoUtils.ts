import { boolean, number, string } from 'yup';
import { FunkoTypeUtil } from '@app-types/utility';

const FUNKO_NAME_MAX_LENGTH = 150;
const FUNKO_NUMBER_MAX_LENGTH = 20;
const FUNKO_EXCLUSIVE_MAX_LENGTH = 100;
const BARCODE_MIN_LENGTH = 8;
const BARCODE_MAX_LENGTH = 14;
const BARCODE_PATTERN = /^\d+$/;
// As the API caps it.
const REMOVAL_REASON_MAX_LENGTH = 500;
const CHASE_LABEL = 'Chase';
const EXCLUSIVE_LABEL = 'Exclusive';

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

// Why an admin deletes a funko other users have: each of them reads it, so it is required.
export const funkoRemovalReasonSchema = string()
  .trim()
  .required('Say why, so the users who had it know')
  .max(REMOVAL_REASON_MAX_LENGTH, `Keep it under ${REMOVAL_REASON_MAX_LENGTH} characters`);

// What a one-line funko label reads: the number and name, plus what sets a chase or an exclusive apart.
type LabelledFunko = { number: string; name: string; isChase: boolean; exclusive: string };

// "Chase", "Exclusive: SDCC", both, or nothing for a regular release.
function distinguishingMarksOf({ isChase, exclusive }: LabelledFunko): string[] {
  const marks: string[] = [];

  if (isChase) marks.push(CHASE_LABEL);
  if (exclusive) marks.push(`${EXCLUSIVE_LABEL}: ${exclusive}`);

  return marks;
}

// "#78 Thanos", "#78 Thanos (Chase)", "#78 Thanos (Exclusive: SDCC)": a regular, a chase and an exclusive of the same
// number and name never read the same in a line of text.
export function funkoLabelOf(funko: LabelledFunko): string {
  const base = `#${funko.number} ${funko.name}`;
  const marks = distinguishingMarksOf(funko);

  return marks.length === 0 ? base : `${base} (${marks.join(', ')})`;
}
