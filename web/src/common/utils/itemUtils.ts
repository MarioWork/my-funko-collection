import { array, number, string } from 'yup';
import { ItemConditionUtil } from '@app-types/utility';

export const ITEM_NOTES_MAX_LENGTH = 2000;
export const MAX_QUANTITY = 1000;
export const MAX_TAGS_PER_ITEM = 20;
export const CURRENCY_PATTERN = /^[A-Z]{3}$/;
export const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const itemQuantitySchema = number()
  .typeError('Quantity must be a number')
  .integer('Quantity must be a whole number')
  .min(1, 'At least 1')
  .max(MAX_QUANTITY, `At most ${MAX_QUANTITY}`)
  .required('Quantity is required');

export const itemConditionSchema = string<ItemConditionUtil>()
  .oneOf(Object.values(ItemConditionUtil), 'Pick a condition')
  .nullable()
  .notRequired();

export const itemPriceCentsSchema = number()
  .typeError('Price must be a number')
  .integer()
  .min(0, 'Price cannot be negative')
  .nullable()
  .notRequired();

export const itemCurrencySchema = string().matches(CURRENCY_PATTERN, 'Use a 3-letter currency code').notRequired();

export const itemPurchasedAtSchema = string()
  .matches(ISO_DATE_PATTERN, { message: 'Use YYYY-MM-DD', excludeEmptyString: true })
  .nullable()
  .notRequired();

export const itemNotesSchema = string()
  .trim()
  .max(ITEM_NOTES_MAX_LENGTH, `Notes must be at most ${ITEM_NOTES_MAX_LENGTH} characters`)
  .nullable()
  .notRequired();

export const itemTagIdsSchema = array()
  .of(number().integer().positive().required())
  .max(MAX_TAGS_PER_ITEM, `At most ${MAX_TAGS_PER_ITEM} tags`)
  .notRequired();

export const itemFunkoIdSchema = number().typeError('Pick a funko').integer().positive().required('Pick a funko');
