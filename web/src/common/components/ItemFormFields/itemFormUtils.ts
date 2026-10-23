import { array, number, object, string, type InferType } from 'yup';
import type { CollectionItemApiModel } from '@app-types/models';
import type { ItemConditionUtil } from '@app-types/utility';
import type { CreateCollectionItem } from '@services/collectionItemService/collectionItemService.type';
import { itemQuantitySchema } from '@utils/itemUtils';
import { centsToUnits, DEFAULT_CURRENCY, unitsToCents } from '@utils/moneyUtils';

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

const NEW_ITEM_QUANTITY = 1;

// A copy being added: one of it, nothing else known yet, and the given tags.
export const newItemFormValues = (tagIds: number[] = []): ItemFormValues => ({
  quantity: NEW_ITEM_QUANTITY,
  condition: '',
  price: '',
  purchasedAt: '',
  notes: '',
  tagIds,
});

export const itemToFormValues = (item: CollectionItemApiModel): ItemFormValues => ({
  quantity: item.quantity,
  condition: item.condition ?? '',
  price: centsToUnits(item.purchasePriceCents),
  purchasedAt: item.purchasedAt ?? '',
  notes: item.notes ?? '',
  tagIds: item.tags.map((tag) => tag.id),
});

// Every field set, so it serves a new item as well as a change to one.
export const toItemPayload = (values: ItemFormValues): Omit<CreateCollectionItem, 'funkoId'> => ({
  quantity: values.quantity,
  condition: values.condition === '' ? null : values.condition,
  purchasePriceCents: values.price === '' ? null : unitsToCents(values.price.replace(',', '.')),
  purchaseCurrency: DEFAULT_CURRENCY,
  purchasedAt: values.purchasedAt === '' ? null : values.purchasedAt,
  notes: values.notes === '' ? null : values.notes,
  tagIds: values.tagIds,
});
