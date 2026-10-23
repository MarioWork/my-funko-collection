import { AuthApiErrorCodes } from '@services/authService/authService';
import type { AuthFailureMessagesUtil } from '@app-types/utility';

export const LOGIN_FAILURE_MESSAGES: AuthFailureMessagesUtil = {
  [AuthApiErrorCodes.SIGN_IN_FAILED]: "That passkey didn't work. Try again, or pick another one.",
  [AuthApiErrorCodes.NOT_SET_UP]: 'Nobody has set up this app yet. Open the setup link from the server log first.',
};

// What to run on the server when every passkey is gone (auth contract, "Recovery").
export const RESET_COMMAND = 'docker compose exec api yarn auth:reset';
