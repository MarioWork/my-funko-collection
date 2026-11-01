import { useState } from 'react';
import type { ApiError } from '@app-types/models';
import { ReauthMethodUtil, type ReauthUtil } from '@app-types/utility';
import { useSignedInUser } from '@hooks/useSignedInUser';
import { AuthApiErrorCodes } from '@services/authService/authService';

export type ConfirmIdentityStep = {
  // True from the first REAUTH_REQUIRED answer on: the dialog then says why and offers the ways to confirm.
  needsReauth: boolean;
  // The user has a password (a username comes with it), so it is offered next to the passkey.
  canUsePassword: boolean;
  password: string;
  setPassword: (password: string) => void;
  // A wrong password, shown on the password field.
  passwordError: string | undefined;
  // The way of confirming last sent: the one that is waiting while the dialog saves.
  method: ReauthMethodUtil | undefined;
  // The failure is the step's own to show (the reauth answer as the notice, a wrong password on its field), not the
  // dialog's alert.
  isStepFailure: boolean;
  // What the next submit sends: nothing before the reauth answer, then the way the user picked.
  reauthFor: (method: ReauthMethodUtil) => ReauthUtil | undefined;
};

// The shared "confirm it's you" step of a change that needs a recent sign-in (a passkey, the password, a user).
export function useConfirmIdentityStep(failure: ApiError | undefined): ConfirmIdentityStep {
  const { username } = useSignedInUser();
  const [hasAskedForReauth, setHasAskedForReauth] = useState(false);
  const [password, setPassword] = useState('');
  const [method, setMethod] = useState<ReauthMethodUtil>();
  const isReauthAnswer = failure?.code === AuthApiErrorCodes.REAUTH_REQUIRED;
  const isWrongPassword = method === ReauthMethodUtil.PASSWORD && failure?.code === AuthApiErrorCodes.SIGN_IN_FAILED;
  const needsReauth = hasAskedForReauth || isReauthAnswer;

  // Derived during render (the previous-value pattern), never in an effect: once asked, it stays asked.
  if (isReauthAnswer && !hasAskedForReauth) setHasAskedForReauth(true);

  const reauthFor = (chosen: ReauthMethodUtil): ReauthUtil | undefined => {
    if (!needsReauth) return undefined;

    setMethod(chosen);

    if (chosen === ReauthMethodUtil.PASSWORD) return { method: chosen, password };

    return { method: chosen };
  };

  return {
    needsReauth,
    canUsePassword: username !== null,
    password,
    setPassword,
    passwordError: isWrongPassword ? failure.message : undefined,
    method,
    isStepFailure: isReauthAnswer || isWrongPassword,
    reauthFor,
  };
}
