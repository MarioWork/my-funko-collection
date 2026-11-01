// How the user confirms it's them when a change needs a sign-in from the last 10 minutes (403 REAUTH_REQUIRED): a
// fresh passkey sign-in, or their own password (only for a user who has one).
export const ReauthMethodUtil = {
  PASSKEY: 'passkey',
  PASSWORD: 'password',
} as const;
export type ReauthMethodUtil = (typeof ReauthMethodUtil)[keyof typeof ReauthMethodUtil];

// What a dialog sends its action once the user was asked to confirm: the method, and the password typed for it.
export type ReauthUtil =
  { method: typeof ReauthMethodUtil.PASSKEY } | { method: typeof ReauthMethodUtil.PASSWORD; password: string };
