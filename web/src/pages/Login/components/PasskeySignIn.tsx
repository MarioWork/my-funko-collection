import { Fingerprint } from 'lucide-react';
import { useFetcher } from 'react-router';
import type { AuthSessionApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import InlineAlert from '@components/InlineAlert';
import PasskeyButton from '@components/PasskeyButton';
import PasskeyUnsupportedNotice from '@components/PasskeyUnsupportedNotice';
import { authFailureMessage } from '@utils/authMessageUtils';
import { createFormData } from '@utils/formDataUtils';
import { isPasskeySupported } from '@utils/passkeyUtils';
import { LOGIN_FAILURE_MESSAGES, LoginIntents } from '../loginUtils';

// One button: the click submits to the login action, which runs the whole passkey sign-in, the browser prompt
// included.
function PasskeySignIn() {
  const fetcher = useFetcher<JSONResponseUtil<AuthSessionApiModel>>();
  const isSupported = isPasskeySupported();
  const isSigningIn = fetcher.state !== 'idle';
  const hasFailed = fetcher.data?.success === false && !isSigningIn;
  const failure = hasFailed ? fetcher.data?.error : undefined;

  const signIn = () =>
    void fetcher.submit(createFormData({ intent: LoginIntents.PASSKEY }), { method: HttpVerbsUtil.POST });

  return (
    <div className="flex flex-col gap-3">
      <PasskeyButton
        isWaiting={isSigningIn}
        isSupported={isSupported}
        icon={<Fingerprint data-icon="inline-start" aria-hidden="true" />}
        size="lg"
        className="h-12 w-full text-base"
        onClick={signIn}
      >
        Sign in with passkey
      </PasskeyButton>
      <p className="-mt-1 text-center text-xs text-muted-foreground">Use Face ID, Touch ID or your passkey manager.</p>
      {isSupported ? null : <PasskeyUnsupportedNotice />}
      {/* role="alert": an assertive live region, read out as soon as the sign-in fails. */}
      {hasFailed ? <InlineAlert tone="error">{authFailureMessage(failure, LOGIN_FAILURE_MESSAGES)}</InlineAlert> : null}
    </div>
  );
}

export default PasskeySignIn;
