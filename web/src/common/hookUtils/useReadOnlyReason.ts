import { DISABLED_REASONS } from '@utils/disabledReasonUtils';
import { useSignedInUser } from './useSignedInUser';

// Why a write control is disabled for a read-only user (an admin limited their account to looking), or undefined
// when the user can make changes. Pass it as a DisabledReason's `reason` and disable the control while it is set;
// the API refuses those writes anyway (403 READ_ONLY). Their own password, passkeys and signing out stay open.
export function useReadOnlyReason(): string | undefined {
  const { isReadOnly } = useSignedInUser();

  return isReadOnly ? DISABLED_REASONS.READ_ONLY : undefined;
}
