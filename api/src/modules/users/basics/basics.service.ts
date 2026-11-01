import { ConflictError } from '../../../lib/httpErrors.ts';
import { assertRecentSignIn, createWebauthnUserId } from '../../auth/auth.service.ts';
import type { AuthSession } from '../../auth/auth.type.ts';
import { createTemporaryPassword } from '../../auth/password/password.service.ts';
import { countAdmins, usersRepository } from '../users.repository.ts';
import type { UserWithTemporaryPasswordResponse } from '../users.schema.ts';
import { USERNAME_TAKEN_MESSAGE, log, toResponse, toResponseWithAdminCount } from '../users.service.ts';
import { basicsRepository } from './basics.repository.ts';
import type { CreateUser, ListUsersQuery, UserListResponse } from './basics.schema.ts';

// For another module that tells every admin something (a new submission): who they are.
export async function getAdminIds(): Promise<number[]> {
  return basicsRepository.findAdminIds();
}

export async function getUsers(query: ListUsersQuery): Promise<UserListResponse> {
  const { data, totalResultNumber } = await basicsRepository.list(query);
  const adminCount = await countAdmins();
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
  const row = await basicsRepository.create({
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
