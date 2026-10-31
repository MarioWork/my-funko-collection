import { z } from 'zod';
import { PaginationQuerySchema, SORT_DIRECTIONS, paginatedResponseSchema } from '../../lib/pagination.ts';
import { BooleanQuerySchema, ContainsQuerySchema } from '../../lib/queryParams.ts';

export const IMAGE_SORT_FIELDS = ['CREATION_DATE', 'SIZE', 'NAME'] as const;

export type ImageSortField = (typeof IMAGE_SORT_FIELDS)[number];

export const ListImagesQuerySchema = PaginationQuerySchema.extend({
  sorting_fields: z.enum(IMAGE_SORT_FIELDS).default('SIZE'),
  direction: z.enum(SORT_DIRECTIONS).default('DESC'),
  // Contains, in the funko's name or the file name.
  q: ContainsQuerySchema,
  // false: only files on disk that no funko image row points at (what `yarn images:prune` would delete).
  hasFunko: BooleanQuerySchema.optional(),
});

const ImageFunkoSchema = z.object({ id: z.number().int(), name: z.string(), number: z.string() });

export const ImageListEntrySchema = z
  .object({
    // "<folder>/<fileKey>": unique for rows and loose files alike.
    key: z.string(),
    // The funko image row; null for a loose file.
    id: z.number().int().nullable(),
    funko: ImageFunkoSchema.nullable(),
    fileName: z.string(),
    width: z.number().int().nullable(),
    height: z.number().int().nullable(),
    // All of its stored sizes together.
    sizeBytes: z.number().int(),
    // How many of the three sizes are on disk (3 when all is well).
    sizeCount: z.number().int(),
    // Its funko's main image (the first one).
    isMain: z.boolean(),
    // Rows: when it was uploaded. Loose files: when the file was last written.
    createdAt: z.iso.datetime(),
    url: z.string().nullable(),
    mediumUrl: z.string().nullable(),
    smallUrl: z.string().nullable(),
    placeholder: z.string().nullable(),
  })
  .meta({ id: 'ImageListEntry' });

export const ImageListResponseSchema = paginatedResponseSchema(ImageListEntrySchema);

export const ImageGroupSchema = z
  .object({
    // The funko id, or "loose" for the files no funko uses.
    key: z.string(),
    funko: ImageFunkoSchema.nullable(),
    imageCount: z.number().int(),
    sizeBytes: z.number().int(),
    newestCreatedAt: z.iso.datetime(),
    images: z.array(ImageListEntrySchema),
  })
  .meta({ id: 'ImageGroup' });

export const ImageGroupListResponseSchema = paginatedResponseSchema(ImageGroupSchema);

export type ListImagesQuery = z.infer<typeof ListImagesQuerySchema>;
export type ImageListEntry = z.infer<typeof ImageListEntrySchema>;
export type ImageListResponse = z.infer<typeof ImageListResponseSchema>;
export type ImageGroup = z.infer<typeof ImageGroupSchema>;
export type ImageGroupListResponse = z.infer<typeof ImageGroupListResponseSchema>;
