// What the users jobs share: a user as the API answers with them, and the messages both jobs give.
import { logger } from '../../lib/logger.ts';
import { countAdmins, isWorkingAdmin, type UserRow } from './users.repository.ts';
import type { UserResponse, UserState } from './users.schema.ts';

export const log = logger.child({ module: 'users' });

export const ENTITY = 'User';
export const USERNAME_TAKEN_MESSAGE = 'That username is taken. Pick another one.';

function temporaryPasswordState(row: UserRow, now: number): UserState | undefined {
  if (row.temporaryPasswordExpiresAt === null) return undefined;

  const isExpired = row.temporaryPasswordExpiresAt.getTime() <= now;

  return isExpired ? 'TEMPORARY_PASSWORD_EXPIRED' : 'TEMPORARY_PASSWORD';
}

function toUserState(row: UserRow, now: number): UserState {
  const temporaryState = temporaryPasswordState(row, now);

  if (temporaryState) return temporaryState;

  const canSignIn = row.hasPassword || row.passkeyCount > 0;

  return canSignIn ? 'ACTIVE' : 'NO_SIGN_IN';
}

export function toResponse(row: UserRow, adminCount: number, now = Date.now()): UserResponse {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    role: row.role,
    isReadOnly: row.isReadOnly,
    state: toUserState(row, now),
    temporaryPasswordExpiresAt: row.temporaryPasswordExpiresAt?.toISOString() ?? null,
    isLastAdmin: isWorkingAdmin(row) && adminCount === 1,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function toResponseWithAdminCount(row: UserRow): Promise<UserResponse> {
  return toResponse(row, await countAdmins());
}
