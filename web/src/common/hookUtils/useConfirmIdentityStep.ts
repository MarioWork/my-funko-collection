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
  // A passkey is offered (everywhere but the temporary-password page, which confirms with that password only).
  canUsePasskey: boolean;
  password: string;
  setPassword: (password: string) => void;
  // A wrong password, shown on the password field.
  passwordError: string | undefined;
  // The way of confirming last sent: the one that is waiting while the dialog saves.
  method: ReauthMethodUtil | undefined;
  // The failure is the step's own to show (the reauth answer as the notice, a wrong password on its field), not the
  // dialog's alert.
  isStepFailure: boolean;
  // Records the way the user picked and returns what the next submit sends (nothing before the reauth answer).
  chooseReauth: (method: ReauthMethodUtil) => ReauthUtil | undefined;
};

type ConfirmIdentityOptions = {
  // Outside the app shell, on the temporary-password page: the user has a password (the temporary one), and only it
  // confirms, so a passkey sign-in can never swap in another user before the password is replaced.
  isPasswordOnly?: boolean;
};

// The shared "confirm it's you" step of a change that needs a recent sign-in (a passkey, the password, a user).
export function useConfirmIdentityStep(
  failure: ApiError | undefined,
  { isPasswordOnly = false }: ConfirmIdentityOptions = {},
): ConfirmIdentityStep {
  const { username } = useSignedInUser();
  const [hasAskedForReauth, setHasAskedForReauth] = useState(false);
  const [password, setPassword] = useState('');
  const [method, setMethod] = useState<ReauthMethodUtil>();
  const isReauthAnswer = failure?.code === AuthApiErrorCodes.REAUTH_REQUIRED;
  const isWrongPassword = method === ReauthMethodUtil.PASSWORD && failure?.code === AuthApiErrorCodes.SIGN_IN_FAILED;
  const needsReauth = hasAskedForReauth || isReauthAnswer;

  // Derived during render (the previous-value pattern), never in an effect: once asked, it stays asked.
  if (isReauthAnswer && !hasAskedForReauth) setHasAskedForReauth(true);

  const chooseReauth = (chosen: ReauthMethodUtil): ReauthUtil | undefined => {
    if (!needsReauth) return undefined;

    setMethod(chosen);

    if (chosen === ReauthMethodUtil.PASSWORD) return { method: chosen, password };

    return { method: chosen };
  };

  return {
    needsReauth,
    canUsePassword: isPasswordOnly || username !== null,
    canUsePasskey: !isPasswordOnly,
    password,
    setPassword,
    passwordError: isWrongPassword ? failure.message : undefined,
    method,
    isStepFailure: isReauthAnswer || isWrongPassword,
    chooseReauth,
  };
}
