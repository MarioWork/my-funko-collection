// Shared wording for the reasons a control is disabled (see DisabledReason). One-off reasons stay where they are used.
export const DISABLED_REASONS = {
  SAVING: 'Saving, one moment.',
  WORKING: 'Finishing the last change, one moment.',
  UPLOADING: 'Uploading the images, one moment.',
} as const;

// The reason while `isBusy`, nothing otherwise: `disabledReason={reasonWhen(isSubmitting, DISABLED_REASONS.SAVING)}`.
export function reasonWhen(condition: boolean, reason: string): string | undefined {
  return condition ? reason : undefined;
}
