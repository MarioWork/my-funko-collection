import { z } from 'zod';
import { FUNKO_TYPES } from '../../db/schema/funkos.ts';
import { ITEM_CONDITIONS } from '../../db/schema/collectionItems.ts';

const ExportCategorySchema = z.object({ id: z.number().int(), name: z.string() });

const ExportSeriesSchema = z.object({ id: z.number().int(), name: z.string() });

const ExportImageSchema = z.object({ id: z.number().int(), fileKey: z.string(), position: z.number().int() });

const ExportFunkoSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  number: z.string(),
  type: z.enum(FUNKO_TYPES),
  categoryId: z.number().int(),
  seriesId: z.number().int().nullable(),
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
    series: z.array(ExportSeriesSchema),
    funkos: z.array(ExportFunkoSchema),
    collections: z.array(ExportCollectionSchema),
    tags: z.array(ExportTagSchema),
    items: z.array(ExportItemSchema),
  })
  .meta({ id: 'Export' });

const OptionalIdSchema = z.coerce.number().int().positive().optional();

// One filter at most: the funkos of one category, series, collection or tag, or one funko. None: every funko.
export const ExportFunkosQuerySchema = z
  .object({
    categoryId: OptionalIdSchema,
    seriesId: OptionalIdSchema,
    collectionId: OptionalIdSchema,
    tagId: OptionalIdSchema,
    funkoId: OptionalIdSchema,
  })
  .refine((query) => Object.values(query).filter((value) => value !== undefined).length <= 1, {
    message: 'Pick one of categoryId, seriesId, collectionId, tagId or funkoId',
  });

export type ExportFunkosQuery = z.infer<typeof ExportFunkosQuerySchema>;

export const EXPORT_SCOPE_KINDS = ['category', 'series', 'collection', 'tag', 'funko'] as const;

// One funko in its readable form (names, not ids), as the CSV, spreadsheet and JSON exports show it.
const FunkoExportItemSchema = z.object({
  collection: z.string(),
  quantity: z.number().int(),
  condition: z.enum(ITEM_CONDITIONS).nullable(),
  // In units (14.99), not cents.
  purchasePrice: z.number().nullable(),
  purchaseCurrency: z.string(),
  purchasedAt: z.string().nullable(),
  tags: z.array(z.string()),
  notes: z.string().nullable(),
});

const FunkoExportFieldsSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  number: z.string(),
  category: z.string(),
  series: z.string().nullable(),
  type: z.enum(FUNKO_TYPES),
  isChase: z.boolean(),
  exclusive: z.string(),
  barcode: z.string().nullable(),
  // A full-size link to each photo, main first. It opens for a signed-in browser.
  photoUrls: z.array(z.string()),
});

const FunkoExportSchema = FunkoExportFieldsSchema.extend({ items: z.array(FunkoExportItemSchema) });

export const FunkosExportResponseSchema = z
  .object({
    exportedAt: z.iso.datetime(),
    // What the file was narrowed to; null for every funko.
    scope: z.object({ kind: z.enum(EXPORT_SCOPE_KINDS), name: z.string() }).nullable(),
    funkos: z.array(FunkoExportSchema),
  })
  .meta({ id: 'FunkosExport' });

export type FunkoExportItem = z.infer<typeof FunkoExportItemSchema>;
export type FunkoExportFields = z.infer<typeof FunkoExportFieldsSchema>;
export type FunkoExport = z.infer<typeof FunkoExportSchema>;
export type FunkosExportResponse = z.infer<typeof FunkosExportResponseSchema>;
export type ExportScopeKind = (typeof EXPORT_SCOPE_KINDS)[number];
// One line of the flat exports: a funko and one of its items, or no item when it is in no collection.
// `itemId` tells two lines of the same item apart from two items (an item can sit under two tags).
export type FunkoExportLine = { funko: FunkoExportFields; item: FunkoExportItem | null; itemId: number | null };

export const EXPORT_LIST_KINDS = ['categories', 'series', 'collections', 'tags'] as const;
export type ExportListKind = (typeof EXPORT_LIST_KINDS)[number];

export const ExportListQuerySchema = z.object({
  // Also export the funkos of every entry (a second sheet, the CSV's lines, or nested in the JSON).
  includeFunkos: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
});

export type ExportListQuery = z.infer<typeof ExportListQuerySchema>;

// Each entry is the list's own columns (name, counts, notes...), plus `funkos` when they were asked for.
export const ListExportResponseSchema = z
  .object({
    exportedAt: z.iso.datetime(),
    kind: z.enum(EXPORT_LIST_KINDS),
    includesFunkos: z.boolean(),
    entries: z.array(
      z.looseObject({ id: z.number().int(), name: z.string(), funkos: z.array(FunkoExportSchema).optional() }),
    ),
  })
  .meta({ id: 'ListExport' });

export type ListExportResponse = z.infer<typeof ListExportResponseSchema>;
export type ExportResponse = z.infer<typeof ExportResponseSchema>;
export type ExportFunko = z.infer<typeof ExportFunkoSchema>;
export type ExportItem = z.infer<typeof ExportItemSchema>;

// One stored image as the image export lists it: no file, only what it is and links to it.
const ImageExportSchema = z.object({
  funkoId: z.number().int().nullable(),
  funkoName: z.string().nullable(),
  funkoNumber: z.string().nullable(),
  fileName: z.string(),
  // Its funko's first image; a loose file (no funko) is never main.
  isMain: z.boolean(),
  width: z.number().int().nullable(),
  height: z.number().int().nullable(),
  sizeBytes: z.number().int(),
  uploadedAt: z.iso.datetime(),
  // Absolute links to the three sizes; null when that file is missing on disk.
  url: z.string().nullable(),
  mediumUrl: z.string().nullable(),
  smallUrl: z.string().nullable(),
});

export const ImagesExportResponseSchema = z
  .object({ exportedAt: z.iso.datetime(), images: z.array(ImageExportSchema) })
  .meta({ id: 'ImagesExport' });

export type ImageExport = z.infer<typeof ImageExportSchema>;
export type ImagesExportResponse = z.infer<typeof ImagesExportResponseSchema>;
