// The shared "confirm it's you" step: changing a passkey or the password, or creating a user, needs a sign-in from
// the last 10 minutes (the API answers 403 REAUTH_REQUIRED otherwise, see withFreshSignIn).
export const CONFIRM_IDENTITY_COPY = {
  TITLE: "Confirm it's you",
  DESCRIPTION: 'This needs a sign-in from the last 10 minutes. Use any of your passkeys to confirm.',
  BUTTON: 'Confirm with passkey',
} as const;
