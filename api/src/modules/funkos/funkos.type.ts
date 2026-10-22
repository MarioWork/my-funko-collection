// Types other modules may import from funkos. The zod contracts stay in the schema files.
import type { z } from 'zod';
import type { FunkoResponseSchema } from './funkos.schema.ts';

export type FunkoResponse = z.infer<typeof FunkoResponseSchema>;
