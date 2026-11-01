// Shared wording for the reasons a control is disabled (see DisabledReason). One-off reasons stay where they are used.
export const DISABLED_REASONS = {
  SAVING: 'Saving, one moment.',
  DOWNLOADING: 'Preparing the download, one moment.',
  LOADING: 'Loading more, one moment.',
  WORKING: 'Finishing the last change, one moment.',
  UPLOADING: 'Uploading the images, one moment.',
  PASSKEY_UNSUPPORTED: "This browser can't use passkeys.",
  PASSKEY_WAITING: 'Waiting for your passkey, one moment.',
  SIGNING_IN: 'Signing in, one moment.',
  // An admin limited this account to looking (docs/GLOSSARY.md "Read-only").
  READ_ONLY: 'Your account is read-only. Ask an admin if you need to change something.',
} as const;

// The first reason that applies, for a control disabled for several: `firstReason(readOnlyReason, busyReason)`.
export function firstReason(...reasons: (string | undefined)[]): string | undefined {
  return reasons.find((reason) => reason !== undefined);
}

// The reason while `isBusy`, nothing otherwise: `disabledReason={reasonWhen(isSubmitting, DISABLED_REASONS.SAVING)}`.
export function reasonWhen(condition: boolean, reason: string): string | undefined {
  return condition ? reason : undefined;
}
