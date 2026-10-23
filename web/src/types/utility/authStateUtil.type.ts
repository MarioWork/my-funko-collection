// Where this browser stands with the API (GET /auth/status): no user yet, a user but no session here, or signed in.
export const AuthStateUtil = {
  SETUP: 'setup',
  SIGNED_OUT: 'signedOut',
  SIGNED_IN: 'signedIn',
} as const;
export type AuthStateUtil = (typeof AuthStateUtil)[keyof typeof AuthStateUtil];
