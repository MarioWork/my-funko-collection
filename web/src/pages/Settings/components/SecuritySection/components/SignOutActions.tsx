import { LogOut, MonitorSmartphone } from 'lucide-react';
import { useState } from 'react';
import { useFetcher } from 'react-router';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import { AUTH_ROUTES_PATHS } from '@application/routes/routesUtils';
import ConfirmDialog from '@components/ConfirmDialog';
import DisabledReason from '@components/DisabledReason';
import InlineAlert from '@components/InlineAlert';
import { Button } from '@components/ui/button';
import { Spinner } from '@components/ui/spinner';
import { DISABLED_REASONS, reasonWhen } from '@utils/disabledReasonUtils';
import { GENERIC_WRITE_ERROR } from '@utils/errorMessageUtils';

type SignOutButtonsProps = {
  isBusy: boolean;
  isSigningOut: boolean;
  onSignOut: () => void;
  onSignOutEverywhere: () => void;
};

function SignOutButtons({ isBusy, isSigningOut, onSignOut, onSignOutEverywhere }: SignOutButtonsProps) {
  const busyReason = reasonWhen(isBusy, DISABLED_REASONS.WORKING);

  return (
    <div className="flex flex-wrap gap-2">
      <DisabledReason reason={busyReason}>
        <Button variant="outline" disabled={isBusy} onClick={onSignOut}>
          {isSigningOut ? <Spinner data-icon="inline-start" /> : <LogOut data-icon="inline-start" aria-hidden="true" />}
          Sign out
        </Button>
      </DisabledReason>
      <DisabledReason reason={busyReason}>
        <Button variant="destructive" disabled={isBusy} onClick={onSignOutEverywhere}>
          <MonitorSmartphone data-icon="inline-start" aria-hidden="true" />
          Sign out everywhere
        </Button>
      </DisabledReason>
    </div>
  );
}

// Both end on the login page (the actions redirect there). "Everywhere" also ends the sign-ins on other devices,
// so it asks first.
function SignOutActions() {
  const signOutFetcher = useFetcher<JSONResponseUtil>();
  const everywhereFetcher = useFetcher<JSONResponseUtil>();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const isSigningOut = signOutFetcher.state !== 'idle';
  const isEndingAll = everywhereFetcher.state !== 'idle';
  const isBusy = isSigningOut || isEndingAll;
  const hasFailed = !isBusy && (signOutFetcher.data?.success === false || everywhereFetcher.data?.success === false);

  const signOut = () =>
    void signOutFetcher.submit(null, { method: HttpVerbsUtil.POST, action: AUTH_ROUTES_PATHS.SIGN_OUT });

  const signOutEverywhere = () =>
    void everywhereFetcher.submit(null, { method: HttpVerbsUtil.POST, action: AUTH_ROUTES_PATHS.SIGN_OUT_EVERYWHERE });

  return (
    <div className="flex flex-col gap-3">
      <SignOutButtons
        isBusy={isBusy}
        isSigningOut={isSigningOut}
        onSignOut={signOut}
        onSignOutEverywhere={() => setIsConfirmOpen(true)}
      />
      <p className="text-xs text-muted-foreground">A sign-in lasts 30 days, or ends after 7 days without use.</p>
      {hasFailed ? <InlineAlert tone="error">{GENERIC_WRITE_ERROR}</InlineAlert> : null}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Sign out everywhere?"
        description="This ends every sign-in, on this device and all the others. You'll need a passkey or your password to get back in."
        confirmLabel="Sign out everywhere"
        isDestructive
        isPending={isEndingAll}
        onConfirm={signOutEverywhere}
        onClose={() => setIsConfirmOpen(false)}
      />
    </div>
  );
}

export default SignOutActions;
