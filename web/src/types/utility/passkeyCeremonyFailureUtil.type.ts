// Why a browser passkey ceremony ended without a passkey. These sit beside the API's error codes in an action's
// failure, so a page maps both kinds to its friendly copy in one place.
export const PasskeyCeremonyFailureUtil = {
  // The prompt was closed, timed out, or the user said no. The browser does not tell these apart, on purpose.
  CANCELLED: 'PASSKEY_CANCELLED',
  // Registering: this authenticator already holds a passkey for the app.
  ALREADY_REGISTERED: 'PASSKEY_ALREADY_REGISTERED',
  // Anything else the browser or the authenticator reported.
  FAILED: 'PASSKEY_CEREMONY_FAILED',
} as const;
export type PasskeyCeremonyFailureUtil = (typeof PasskeyCeremonyFailureUtil)[keyof typeof PasskeyCeremonyFailureUtil];
