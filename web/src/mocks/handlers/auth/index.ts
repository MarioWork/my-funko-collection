import addPasskeyHandler from './addPasskey.mock.handler';
import deletePasskeyHandler from './deletePasskey.mock.handler';
import finishLoginHandler from './finishLogin.mock.handler';
import finishSetupHandler from './finishSetup.mock.handler';
import getAuthStatusHandler from './getAuthStatus.mock.handler';
import listPasskeysHandler from './listPasskeys.mock.handler';
import logoutHandler from './logout.mock.handler';
import logoutEverywhereHandler from './logoutEverywhere.mock.handler';
import passwordLoginHandler from './passwordLogin.mock.handler';
import requireSessionHandler from './requireSession.mock.handler';
import setPasswordHandler from './setPassword.mock.handler';
import startAddPasskeyHandler from './startAddPasskey.mock.handler';
import startLoginHandler from './startLogin.mock.handler';
import startSetupHandler from './startSetup.mock.handler';

// The session check comes first so it sees every request; the root getHandlers() puts this group first too.
export const authMockHandlers = (baseUrl: string) => [
  ...requireSessionHandler(baseUrl),
  ...getAuthStatusHandler(baseUrl),
  ...startSetupHandler(baseUrl),
  ...finishSetupHandler(baseUrl),
  ...startLoginHandler(baseUrl),
  ...finishLoginHandler(baseUrl),
  ...passwordLoginHandler(baseUrl),
  ...setPasswordHandler(baseUrl),
  ...logoutHandler(baseUrl),
  ...logoutEverywhereHandler(baseUrl),
  ...listPasskeysHandler(baseUrl),
  ...startAddPasskeyHandler(baseUrl),
  ...addPasskeyHandler(baseUrl),
  ...deletePasskeyHandler(baseUrl),
];
