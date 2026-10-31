import addUserHandler from './addUser.mock.handler';
import listUsersHandler from './listUsers.mock.handler';

export const userMockHandlers = (baseUrl: string) => [...listUsersHandler(baseUrl), ...addUserHandler(baseUrl)];
