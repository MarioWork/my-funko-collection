import { sql } from 'drizzle-orm';
import { integer } from 'drizzle-orm/sqlite-core';

// SQLite has no timestamp type: milliseconds since the epoch in an integer, mapped to a Date by Drizzle.
// The DB default covers rows written outside the app; `$onUpdate` runs only through Drizzle (runtime-only).
const nowMs = sql`(cast(unixepoch('subsec') * 1000 as integer))`;

export const timestamps = {
  createdAt: integer({ mode: 'timestamp_ms' }).notNull().default(nowMs),
  updatedAt: integer({ mode: 'timestamp_ms' })
    .notNull()
    .default(nowMs)
    .$onUpdate(() => new Date()),
};
