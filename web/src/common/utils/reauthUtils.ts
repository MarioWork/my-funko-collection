// The shared "confirm it's you" step: changing a passkey or the password, or creating or changing a user, needs a
// sign-in from the last 10 minutes (the API answers 403 REAUTH_REQUIRED otherwise, see withRecentSignIn).
export const CONFIRM_IDENTITY_COPY = {
  TITLE: "Confirm it's you",
  BUTTON: 'Confirm with passkey',
  PASSWORD_BUTTON: 'Confirm with password',
  PASSWORD_LABEL: 'Your current password',
  PASSWORD_MISSING_REASON: 'Type your password first.',
} as const;

const RECENT_SIGN_IN_NEEDED = 'This needs a recent sign-in (within the last 10 minutes).';

// A user with a password may confirm with it too; one with only passkeys sees the passkey wording alone.
export function confirmIdentityDescription(canUsePassword: boolean): string {
  const howToConfirm = canUsePassword
    ? 'Type your password, or use any of your passkeys, to confirm.'
    : 'Use any of your passkeys to confirm.';

  return `${RECENT_SIGN_IN_NEEDED} ${howToConfirm}`;
}
