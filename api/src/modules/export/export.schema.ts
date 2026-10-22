import { z } from 'zod';
import { FUNKO_TYPES } from '../../db/schema/funkos.ts';
import { ITEM_CONDITIONS } from '../../db/schema/collectionItems.ts';

const ExportCategorySchema = z.object({ id: z.number().int(), name: z.string() });

const ExportImageSchema = z.object({ id: z.number().int(), fileKey: z.string(), position: z.number().int() });

const ExportFunkoSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  number: z.string(),
  type: z.enum(FUNKO_TYPES),
  categoryId: z.number().int(),
  isChase: z.boolean(),
  exclusive: z.string(),
  barcode: z.string().nullable(),
  images: z.array(ExportImageSchema),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

const ExportCollectionSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  notes: z.string().nullable(),
  isDefault: z.boolean(),
});

const ExportTagSchema = z.object({ id: z.number().int(), name: z.string(), notes: z.string().nullable() });

const ExportItemSchema = z.object({
  id: z.number().int(),
  collectionId: z.number().int(),
  funkoId: z.number().int(),
  quantity: z.number().int(),
  condition: z.enum(ITEM_CONDITIONS).nullable(),
  purchasePriceCents: z.number().int().nullable(),
  purchaseCurrency: z.string(),
  purchasedAt: z.string().nullable(),
  notes: z.string().nullable(),
  tagIds: z.array(z.number().int()),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const ExportResponseSchema = z
  .object({
    exportedAt: z.iso.datetime(),
    categories: z.array(ExportCategorySchema),
    funkos: z.array(ExportFunkoSchema),
    collections: z.array(ExportCollectionSchema),
    tags: z.array(ExportTagSchema),
    items: z.array(ExportItemSchema),
  })
  .meta({ id: 'Export' });

export type ExportResponse = z.infer<typeof ExportResponseSchema>;
export type ExportFunko = z.infer<typeof ExportFunkoSchema>;
export type ExportItem = z.infer<typeof ExportItemSchema>;
