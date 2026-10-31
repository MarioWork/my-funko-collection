import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { z } from 'zod';
import { ErrorResponseSchema } from '../../lib/errorHandler.ts';
import {
  EXPORT_LIST_KINDS,
  ExportFunkosQuerySchema,
  ExportListQuerySchema,
  ExportResponseSchema,
  FunkosExportResponseSchema,
  ImagesExportResponseSchema,
  ListExportResponseSchema,
  type ExportListKind,
} from './export.schema.ts';
import {
  getExport,
  getFunkosCsv,
  getFunkosJson,
  getFunkosSpreadsheet,
  getImagesCsv,
  getImagesJson,
  getImagesSpreadsheet,
  getItemsCsv,
  getListCsv,
  getListJson,
  getListSpreadsheet,
} from './export.service.ts';

const TAGS = ['export'];
const LIST_NOUNS: Record<ExportListKind, string> = {
  categories: 'category',
  series: 'series',
  collections: 'collection',
  tags: 'tag',
};
const SpreadsheetFileSchema = z.instanceof(Buffer).meta({ type: 'string', format: 'binary' });
const JSON_FILE_NAME = 'my-funko-collection.json';
const CSV_FILE_NAME = 'my-funko-collection-items.csv';
const CSV_CONTENT_TYPE = 'text/csv; charset=utf-8';
const XLSX_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function attachment(fileName: string): string {
  return `attachment; filename="${fileName}"`;
}

export const exportRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/',
    {
      prefixTrailingSlash: 'no-slash',
      schema: { tags: TAGS, summary: 'Everything as one JSON download', response: { 200: ExportResponseSchema } },
    },
    async (_request, reply) => {
      const data = await getExport();

      return reply.header('content-disposition', attachment(JSON_FILE_NAME)).send(data);
    },
  );

  app.get(
    '/items.csv',
    {
      schema: {
        tags: TAGS,
        summary: 'One CSV line per collection item',
        produces: [CSV_CONTENT_TYPE],
        response: { 200: z.string() },
      },
    },
    async (_request, reply) => {
      const csv = await getItemsCsv();

      return reply.type(CSV_CONTENT_TYPE).header('content-disposition', attachment(CSV_FILE_NAME)).send(csv);
    },
  );

  app.get(
    '/funkos.csv',
    {
      schema: {
        tags: TAGS,
        summary: 'The funkos of one category, series, collection or tag as CSV (every funko when no filter)',
        querystring: ExportFunkosQuerySchema,
        produces: [CSV_CONTENT_TYPE],
        response: { 200: z.string(), 400: ErrorResponseSchema, 404: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      const { fileName, content } = await getFunkosCsv(request.query);

      return reply.type(CSV_CONTENT_TYPE).header('content-disposition', attachment(fileName)).send(content);
    },
  );

  app.get(
    '/funkos.json',
    {
      schema: {
        tags: TAGS,
        summary: 'The same funkos as JSON, one entry per funko with its items inside',
        querystring: ExportFunkosQuerySchema,
        response: { 200: FunkosExportResponseSchema, 400: ErrorResponseSchema, 404: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      const { fileName, content } = await getFunkosJson(request.query);

      return reply.header('content-disposition', attachment(fileName)).send(content);
    },
  );

  // Binary: a Buffer goes out as-is (Fastify never serialises one); the schema documents it as a file.
  app.get(
    '/funkos.xlsx',
    {
      schema: {
        tags: TAGS,
        summary: 'The same funkos as an .xlsx spreadsheet (Excel, Numbers, Google Sheets)',
        querystring: ExportFunkosQuerySchema,
        produces: [XLSX_CONTENT_TYPE],
        response: { 200: SpreadsheetFileSchema, 400: ErrorResponseSchema, 404: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      const { fileName, content } = await getFunkosSpreadsheet(request.query);

      return reply.type(XLSX_CONTENT_TYPE).header('content-disposition', attachment(fileName)).send(content);
    },
  );

  // Whole lists: /export/categories.xlsx, /export/tags.json?includeFunkos=true, ... One route per list and format.
  for (const kind of EXPORT_LIST_KINDS) {
    app.get(
      `/${kind}.csv`,
      {
        schema: {
          tags: TAGS,
          summary: `Every ${LIST_NOUNS[kind]} as CSV (or, with includeFunkos, their funkos)`,
          querystring: ExportListQuerySchema,
          produces: [CSV_CONTENT_TYPE],
          response: { 200: z.string(), 400: ErrorResponseSchema },
        },
      },
      async (request, reply) => {
        const { fileName, content } = await getListCsv(kind, request.query);

        return reply.type(CSV_CONTENT_TYPE).header('content-disposition', attachment(fileName)).send(content);
      },
    );

    app.get(
      `/${kind}.json`,
      {
        schema: {
          tags: TAGS,
          summary: `Every ${LIST_NOUNS[kind]} as JSON, each with its funkos when includeFunkos is set`,
          querystring: ExportListQuerySchema,
          response: { 200: ListExportResponseSchema, 400: ErrorResponseSchema },
        },
      },
      async (request, reply) => {
        const { fileName, content } = await getListJson(kind, request.query);

        return reply.header('content-disposition', attachment(fileName)).send(content);
      },
    );

    app.get(
      `/${kind}.xlsx`,
      {
        schema: {
          tags: TAGS,
          summary: `Every ${LIST_NOUNS[kind]} as a spreadsheet, with a second sheet of funkos when includeFunkos is set`,
          querystring: ExportListQuerySchema,
          produces: [XLSX_CONTENT_TYPE],
          response: { 200: SpreadsheetFileSchema, 400: ErrorResponseSchema },
        },
      },
      async (request, reply) => {
        const { fileName, content } = await getListSpreadsheet(kind, request.query);

        return reply.type(XLSX_CONTENT_TYPE).header('content-disposition', attachment(fileName)).send(content);
      },
    );
  }

  // Every stored image: what it is and links to it, never the files.
  app.get(
    '/images.csv',
    {
      config: { isAdminOnly: true },
      schema: {
        tags: TAGS,
        summary: 'Every stored image as CSV: its funko, file, size and links',
        produces: [CSV_CONTENT_TYPE],
        response: { 200: z.string() },
      },
    },
    async (_request, reply) => {
      const { fileName, content } = await getImagesCsv();

      return reply.type(CSV_CONTENT_TYPE).header('content-disposition', attachment(fileName)).send(content);
    },
  );

  app.get(
    '/images.json',
    {
      config: { isAdminOnly: true },
      schema: {
        tags: TAGS,
        summary: 'Every stored image as JSON: its funko, file, size and links',
        response: { 200: ImagesExportResponseSchema },
      },
    },
    async (_request, reply) => {
      const { fileName, content } = await getImagesJson();

      return reply.header('content-disposition', attachment(fileName)).send(content);
    },
  );

  app.get(
    '/images.xlsx',
    {
      config: { isAdminOnly: true },
      schema: {
        tags: TAGS,
        summary: 'Every stored image as a spreadsheet: its funko, file, size and links',
        produces: [XLSX_CONTENT_TYPE],
        response: { 200: SpreadsheetFileSchema },
      },
    },
    async (_request, reply) => {
      const { fileName, content } = await getImagesSpreadsheet();

      return reply.type(XLSX_CONTENT_TYPE).header('content-disposition', attachment(fileName)).send(content);
    },
  );
};
