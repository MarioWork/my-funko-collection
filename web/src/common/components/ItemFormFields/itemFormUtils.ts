import { array, number, object, string, type InferType } from 'yup';
import type { CollectionItemApiModel } from '@app-types/models';
import type { ItemConditionUtil } from '@app-types/utility';
import type {
  CreateCollectionItem,
  UpdateCollectionItem,
} from '@services/collectionItemService/collectionItemService.type';
import { itemConditionSchema, itemNotesSchema, itemPurchasedAtSchema, itemQuantitySchema } from '@utils/itemUtils';
import { DEFAULT_CURRENCY, unitsToCents } from '@utils/moneyUtils';

const PRICE_PATTERN = /^\d+([.,]\d{1,2})?$/;

// Form values as inputs produce them; `toItemPayload` turns the price into cents and empties into null.
export const itemFormSchema = object({
  quantity: itemQuantitySchema,
  condition: string<ItemConditionUtil | ''>().defined().default(''),
  price: string()
    .trim()
    .matches(PRICE_PATTERN, { message: 'Use a number like 14.99', excludeEmptyString: true })
    .defined()
    .default(''),
  purchasedAt: string().defined().default(''),
  notes: string().trim().defined().default(''),
  tagIds: array().of(number().required()).defined().default([]),
});

export type ItemFormValues = InferType<typeof itemFormSchema>;

export const getInitialItemValues = (overrides: Partial<ItemFormValues> = {}): ItemFormValues => ({
  quantity: 1,
  condition: '',
  price: '',
  purchasedAt: '',
  notes: '',
  tagIds: [],
  ...overrides,
});

export const itemToFormValues = (item: CollectionItemApiModel): ItemFormValues => ({
  quantity: item.quantity,
  condition: item.condition ?? '',
  price: item.purchasePriceCents === null ? '' : (item.purchasePriceCents / 100).toFixed(2),
  purchasedAt: item.purchasedAt ?? '',
  notes: item.notes ?? '',
  tagIds: item.tags.map((tag) => tag.id),
});

export const toItemPayload = (values: ItemFormValues): UpdateCollectionItem => ({
  quantity: values.quantity,
  condition: values.condition === '' ? null : values.condition,
  purchasePriceCents: values.price === '' ? null : unitsToCents(values.price.replace(',', '.')),
  purchaseCurrency: DEFAULT_CURRENCY,
  purchasedAt: values.purchasedAt === '' ? null : values.purchasedAt,
  notes: values.notes === '' ? null : values.notes,
  tagIds: values.tagIds,
});

export const toCreateItemPayload = (funkoId: number, values: ItemFormValues): CreateCollectionItem => ({
  funkoId,
  ...toItemPayload(values),
  quantity: values.quantity,
});

// The service schemas validate purchasedAt / condition again on the action side; the form keeps these for UX.
export { itemConditionSchema, itemNotesSchema, itemPurchasedAtSchema };
