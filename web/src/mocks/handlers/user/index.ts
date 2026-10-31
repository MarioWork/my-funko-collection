import addTemporaryPasswordHandler from './addTemporaryPassword.mock.handler';
import addUserHandler from './addUser.mock.handler';
import deleteUserHandler from './deleteUser.mock.handler';
import listUsersHandler from './listUsers.mock.handler';
import updateUserHandler from './updateUser.mock.handler';

export const userMockHandlers = (baseUrl: string) => [
  ...listUsersHandler(baseUrl),
  ...addUserHandler(baseUrl),
  ...updateUserHandler(baseUrl),
  ...addTemporaryPasswordHandler(baseUrl),
  ...deleteUserHandler(baseUrl),
];
