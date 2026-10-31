import { z } from 'zod';

// Row ids are Postgres `integer` columns: 1 to 2^31 - 1. A larger number in a URL or a body is a 400 here, not a
// database error later.
export const MAX_ID = 2_147_483_647;

// An id in a JSON body.
export const IdSchema = z.number().int().positive().max(MAX_ID);

// An id in a path or query string, where it arrives as text.
export const IdParamSchema = z.coerce.number().int().positive().max(MAX_ID);
