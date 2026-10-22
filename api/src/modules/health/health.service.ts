import { pingDb } from '../../db/client.ts';

const OK_STATUS = 'ok' as const;

// Liveness: the process answers. Nothing to check.
export function getLiveness(): { status: typeof OK_STATUS } {
  return { status: OK_STATUS };
}

// Readiness: the database answers too. A failure is reported, never thrown, so the probe stays cheap.
export async function isDatabaseReady(): Promise<boolean> {
  try {
    await pingDb();

    return true;
  } catch {
    return false;
  }
}
