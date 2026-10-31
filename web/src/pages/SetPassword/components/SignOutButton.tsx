import { LogOut } from 'lucide-react';
import { useFetcher } from 'react-router';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import DisabledReason from '@components/DisabledReason';
import InlineAlert from '@components/InlineAlert';
import { Button } from '@components/ui/button';
import { Spinner } from '@components/ui/spinner';
import { DISABLED_REASONS, reasonWhen } from '@utils/disabledReasonUtils';
import { GENERIC_WRITE_ERROR } from '@utils/errorMessageUtils';
import { createFormData } from '@utils/formDataUtils';
import { SetPasswordIntents } from '../setPasswordUtils';

// Not now: back to the login page. The temporary password still works until its 7 days are up.
function SignOutButton() {
  const fetcher = useFetcher<JSONResponseUtil>();
  const isSigningOut = fetcher.state !== 'idle';
  const hasFailed = fetcher.data?.success === false && !isSigningOut;

  const signOut = () =>
    void fetcher.submit(createFormData({ intent: SetPasswordIntents.SIGN_OUT }), { method: HttpVerbsUtil.POST });

  return (
    <div className="flex flex-col items-center gap-2">
      <DisabledReason reason={reasonWhen(isSigningOut, DISABLED_REASONS.WORKING)}>
        <Button variant="ghost" disabled={isSigningOut} onClick={signOut}>
          {isSigningOut ? <Spinner data-icon="inline-start" /> : <LogOut data-icon="inline-start" aria-hidden="true" />}
          Sign out
        </Button>
      </DisabledReason>
      {hasFailed ? <InlineAlert tone="error">{GENERIC_WRITE_ERROR}</InlineAlert> : null}
    </div>
  );
}

export default SignOutButton;
