import { ConflictError } from '../../lib/httpErrors.ts';
import { logger } from '../../lib/logger.ts';
import {
  assertRecentSignIn,
  createTemporaryPassword,
  createWebauthnUserId,
  type AuthSession,
} from '../auth/auth.service.ts';
import { usersRepository, type UserRow } from './users.repository.ts';
import type {
  CreateUser,
  CreatedUserResponse,
  ListUsersQuery,
  UserListResponse,
  UserResponse,
  UserState,
} from './users.schema.ts';

const log = logger.child({ module: 'users' });

const USERNAME_TAKEN_MESSAGE = 'That username is taken. Pick another one.';

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

function toResponse(row: UserRow, now = Date.now()): UserResponse {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    role: row.role,
    state: toUserState(row, now),
    temporaryPasswordExpiresAt: row.temporaryPasswordExpiresAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getUsers(query: ListUsersQuery): Promise<UserListResponse> {
  const { data, totalResultNumber } = await usersRepository.list(query);
  const now = Date.now();

  return { data: data.map((row) => toResponse(row, now)), totalResultNumber, currentPage: query.page };
}

// An admin creates a user (ADR 0002): needs the admin's sign-in from the last 10 minutes. The user is named after
// their username and gets an app-made temporary password, which this answer carries once and nothing stores.
export async function addUser(session: AuthSession, { username, role }: CreateUser): Promise<CreatedUserResponse> {
  assertRecentSignIn(session);

  if (await usersRepository.isUsernameTaken(username)) throw new ConflictError(USERNAME_TAKEN_MESSAGE);

  const temporaryPassword = await createTemporaryPassword();
  const row = await usersRepository.create({
    name: username,
    username,
    role,
    webauthnUserId: createWebauthnUserId(),
    passwordHash: temporaryPassword.passwordHash,
    temporaryPasswordExpiresAt: temporaryPassword.expiresAt,
  });

  log.info({ userId: row.id, createdBy: session.userId, role }, 'user created');

  return { user: toResponse(row), temporaryPassword: temporaryPassword.password };
}
