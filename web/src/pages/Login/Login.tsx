import { Fingerprint } from 'lucide-react';
import { useFetcher } from 'react-router';
import type { AuthSessionApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import AuthLayout from '@components/AuthLayout';
import InlineAlert from '@components/InlineAlert';
import PasskeyButton from '@components/PasskeyButton';
import PasskeyUnsupportedNotice from '@components/PasskeyUnsupportedNotice';
import { authFailureMessage } from '@utils/authMessageUtils';
import { isPasskeySupported } from '@utils/passkeyUtils';
import LockedOutHelp from './components/LockedOutHelp';
import { LOGIN_FAILURE_MESSAGES } from './loginUtils';

// Outside the app shell. One button: the click submits to this route's action, which runs the whole passkey
// sign-in (the browser prompt included) and redirects back to where the user was.
function Login() {
  const fetcher = useFetcher<JSONResponseUtil<AuthSessionApiModel>>();
  const isSupported = isPasskeySupported();
  const isSigningIn = fetcher.state !== 'idle';
  const hasFailed = fetcher.data?.success === false && !isSigningIn;
  const failure = hasFailed ? fetcher.data?.error : undefined;

  const signIn = () => void fetcher.submit(null, { method: HttpVerbsUtil.POST });

  return (
    <AuthLayout
      label="Collector only"
      title="Welcome back!"
      description="Your shelves missed you. Sign in to see your collection."
      footer="Only you can open this collection."
    >
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
      <LockedOutHelp />
    </AuthLayout>
  );
}

export default Login;
