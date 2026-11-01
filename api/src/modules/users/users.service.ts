import { BadRequestError, ConflictError, HttpError, NotFoundError } from '../../lib/httpErrors.ts';
import { logger } from '../../lib/logger.ts';
import {
  assertRecentSignIn,
  createTemporaryPassword,
  createWebauthnUserId,
  type AuthSession,
} from '../auth/auth.service.ts';
import { isWorkingAdmin, usersRepository, type GuardedChange, type UserRow } from './users.repository.ts';
import type {
  CreateUser,
  ListUsersQuery,
  NewTemporaryPassword,
  UpdateUser,
  UserListResponse,
  UserResponse,
  UserState,
  UserWithTemporaryPasswordResponse,
} from './users.schema.ts';

const log = logger.child({ module: 'users' });

const ENTITY = 'User';
const USERNAME_TAKEN_MESSAGE = 'That username is taken. Pick another one.';
const LAST_ADMIN_MESSAGE =
  'There must always be at least one admin who can make changes. Make someone else an admin first.';
const USERNAME_REQUIRED_MESSAGE = 'This user has no username yet. Pick one for them.';
const USERNAME_ALREADY_SET_MESSAGE = 'This user already has a username, and keeps it.';

// There is always at least one admin who is not read-only (docs/GLOSSARY.md): the last one can't be made a member,
// made read-only or deleted.
class LastAdminError extends HttpError {
  constructor() {
    super(LAST_ADMIN_MESSAGE, { code: 'LAST_ADMIN', statusCode: 409 });
  }
}

class UsernameRequiredError extends HttpError {
  constructor() {
    super(USERNAME_REQUIRED_MESSAGE, { code: 'USERNAME_REQUIRED', statusCode: 400 });
  }
}

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

function toResponse(row: UserRow, adminCount: number, now = Date.now()): UserResponse {
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

// For another module that tells every admin something (a new submission): who they are.
export async function getAdminIds(): Promise<number[]> {
  return usersRepository.findAdminIds();
}

export async function getUsers(query: ListUsersQuery): Promise<UserListResponse> {
  const { data, totalResultNumber } = await usersRepository.list(query);
  const adminCount = await usersRepository.countAdmins();
  const now = Date.now();

  return { data: data.map((row) => toResponse(row, adminCount, now)), totalResultNumber, currentPage: query.page };
}

// An admin creates a user (ADR 0002): needs the admin's sign-in from the last 10 minutes. The user is named after
// their username and gets an app-made temporary password, which this answer carries once and nothing stores.
export async function addUser(
  session: AuthSession,
  { username, role }: CreateUser,
): Promise<UserWithTemporaryPasswordResponse> {
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

  return { user: await toResponseWithAdminCount(row), temporaryPassword: temporaryPassword.password };
}

async function toResponseWithAdminCount(row: UserRow): Promise<UserResponse> {
  return toResponse(row, await usersRepository.countAdmins());
}

// The result of a change guarded by the last-admin rule, or the error that explains why it did not happen.
function unwrapGuardedChange<Result>(userId: number, change: GuardedChange<Result>): Result {
  if ('isMissing' in change) throw new NotFoundError(ENTITY, userId);

  if ('isLastAdmin' in change) throw new LastAdminError();

  return change.result;
}

// An admin changes a user's role (issue #7) or makes them read-only and back (issue #8): needs a recent sign-in,
// never takes away the last admin who can make changes, and ends every session of that user (their own too, when
// an admin changes themselves). The API reads both from the user on every request anyway; ending the sessions
// makes the app ask again, so it shows the new role or the read-only controls at once instead of after a reload.
export async function updateUser(session: AuthSession, userId: number, change: UpdateUser): Promise<UserResponse> {
  assertRecentSignIn(session);

  const row = unwrapGuardedChange(userId, await usersRepository.update(userId, change));

  log.info({ userId, changedBy: session.userId, role: change.role, isReadOnly: change.isReadOnly }, 'user changed');

  return toResponseWithAdminCount(row);
}

async function usernameForTemporaryPassword(userId: number, requested: string | undefined): Promise<string> {
  const user = await usersRepository.findById(userId);

  if (!user) throw new NotFoundError(ENTITY, userId);

  // Only a user with no username gets one here: a new temporary password never renames anyone.
  if (user.username) {
    const isRename = requested !== undefined && requested !== user.username;

    if (isRename) throw new BadRequestError(USERNAME_ALREADY_SET_MESSAGE);

    return user.username;
  }

  if (!requested) throw new UsernameRequiredError();

  if (await usersRepository.isUsernameTaken(requested, userId)) throw new ConflictError(USERNAME_TAKEN_MESSAGE);

  return requested;
}

// An admin gives a user who forgot their password a new temporary password, by the same rules as on create:
// app-made, shown once in this answer, dead after 7 days unused, and it must be replaced before anything else.
// The old password stops working and every session of the user ends. Their passkeys stay.
export async function addTemporaryPassword(
  session: AuthSession,
  userId: number,
  { username: requestedUsername }: NewTemporaryPassword,
): Promise<UserWithTemporaryPasswordResponse> {
  assertRecentSignIn(session);

  const username = await usernameForTemporaryPassword(userId, requestedUsername);
  const temporaryPassword = await createTemporaryPassword();
  const row = await usersRepository.setTemporaryPassword(userId, {
    username,
    passwordHash: temporaryPassword.passwordHash,
    temporaryPasswordExpiresAt: temporaryPassword.expiresAt,
  });

  if (!row) throw new NotFoundError(ENTITY, userId);

  log.info({ userId, changedBy: session.userId }, 'temporary password made');

  return { user: await toResponseWithAdminCount(row), temporaryPassword: temporaryPassword.password };
}

// An admin deletes a user: needs a recent sign-in and never takes away the last admin. Their sessions, passkeys,
// collections, items and tags go with them; catalogue funkos stay, and images they uploaded keep showing with a
// removed user as their uploader.
export async function deleteUser(session: AuthSession, userId: number): Promise<void> {
  assertRecentSignIn(session);

  unwrapGuardedChange(userId, await usersRepository.delete(userId));

  log.info({ userId, deletedBy: session.userId }, 'user deleted');
}
