import InlineAlert from '@components/InlineAlert';
import { CONFIRM_IDENTITY_COPY, confirmIdentityDescription } from '@utils/reauthUtils';

type Props = {
  // What happens once confirmed: "Then your browser asks where to save the new one."
  nextStep: string;
  // The user has a password, offered next to the passkeys.
  canUsePassword: boolean;
};

// Shown when the server wants a fresh sign-in before the change: how to confirm, and what happens after.
function ReauthNotice({ nextStep, canUsePassword }: Props) {
  return (
    <InlineAlert tone="info">
      <strong className="font-semibold">{CONFIRM_IDENTITY_COPY.TITLE}.</strong>{' '}
      {confirmIdentityDescription(canUsePassword)} {nextStep}
    </InlineAlert>
  );
}

export default ReauthNotice;
