import InlineAlert from '@components/InlineAlert';
import { CONFIRM_IDENTITY_COPY } from '../../../settingsUtils';

type Props = {
  // What happens once confirmed: "Then your browser asks where to save the new one."
  nextStep: string;
};

// Shown when the server wants a fresh sign-in before the change: what happens when the button is pressed.
function ReauthNotice({ nextStep }: Props) {
  return (
    <InlineAlert tone="info">
      <strong className="font-semibold">{CONFIRM_IDENTITY_COPY.TITLE}.</strong> {CONFIRM_IDENTITY_COPY.DESCRIPTION}{' '}
      {nextStep}
    </InlineAlert>
  );
}

export default ReauthNotice;
