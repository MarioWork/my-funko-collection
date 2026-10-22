import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { z } from 'zod';
import { ExportResponseSchema } from './export.schema.ts';
import { getExport, getItemsCsv } from './export.service.ts';

const TAGS = ['export'];
const JSON_FILE_NAME = 'my-funko-collection.json';
const CSV_FILE_NAME = 'my-funko-collection-items.csv';
const CSV_CONTENT_TYPE = 'text/csv; charset=utf-8';

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
};
