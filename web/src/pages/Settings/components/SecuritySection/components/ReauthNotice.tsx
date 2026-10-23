import InlineAlert from '@components/InlineAlert';
import { CONFIRM_IDENTITY_COPY } from '../../../settingsUtils';

// Shown when the server wants a fresh sign-in before a new passkey: what happens when the button is pressed.
function ReauthNotice() {
  return (
    <InlineAlert tone="info">
      <strong className="font-semibold">{CONFIRM_IDENTITY_COPY.TITLE}.</strong> {CONFIRM_IDENTITY_COPY.DESCRIPTION} Then
      your browser asks where to save the new one.
    </InlineAlert>
  );
}

export default ReauthNotice;
