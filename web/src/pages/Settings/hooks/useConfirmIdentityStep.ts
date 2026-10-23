import { useState } from 'react';
import type { ApiError } from '@app-types/models';
import { AuthApiErrorCodes } from '@services/authService/authService';

// The shared "confirm it's you" step of adding and removing a passkey. True from the first REAUTH_REQUIRED answer
// on: the dialog then says why and submits with `isReauth`, so the action signs in afresh before the write.
export function useConfirmIdentityStep(failure: ApiError | undefined): boolean {
  const [needsReauth, setNeedsReauth] = useState(false);
  const isReauthAnswer = failure?.code === AuthApiErrorCodes.REAUTH_REQUIRED;

  // Derived during render (the previous-value pattern), never in an effect: once asked, it stays asked.
  if (isReauthAnswer && !needsReauth) setNeedsReauth(true);

  return needsReauth || isReauthAnswer;
}
