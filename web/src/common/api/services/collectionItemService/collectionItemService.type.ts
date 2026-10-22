import { number, object, type InferType } from 'yup';
import {
  itemConditionSchema,
  itemCurrencySchema,
  itemFunkoIdSchema,
  itemNotesSchema,
  itemPriceCentsSchema,
  itemPurchasedAtSchema,
  itemQuantitySchema,
  itemTagIdsSchema,
} from '@utils/itemUtils';

export const CreateCollectionItemSchema = object({
  funkoId: itemFunkoIdSchema,
  quantity: itemQuantitySchema,
  condition: itemConditionSchema,
  purchasePriceCents: itemPriceCentsSchema,
  purchaseCurrency: itemCurrencySchema,
  purchasedAt: itemPurchasedAtSchema,
  notes: itemNotesSchema,
  tagIds: itemTagIdsSchema,
});

// A patch never changes the funko: move the item or add another instead.
export const UpdateCollectionItemSchema = CreateCollectionItemSchema.omit(['funkoId']).partial();

export const MoveCollectionItemSchema = object({
  toCollectionId: number().integer().positive().required(),
});

export type CreateCollectionItem = InferType<typeof CreateCollectionItemSchema>;
export type UpdateCollectionItem = InferType<typeof UpdateCollectionItemSchema>;
export type MoveCollectionItem = InferType<typeof MoveCollectionItemSchema>;
