import InlineAlert from '@components/InlineAlert';

// Shown instead of a silent dead button when the browser has no WebAuthn (an old browser, an in-app web view).
function PasskeyUnsupportedNotice() {
  return (
    <InlineAlert tone="info">
      This browser can&apos;t use passkeys. Try the latest Safari, Chrome, Edge or Firefox, on a device with a screen
      lock.
    </InlineAlert>
  );
}

export default PasskeyUnsupportedNotice;
