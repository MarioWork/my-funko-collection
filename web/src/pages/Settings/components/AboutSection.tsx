import { APP_NAME } from '@utils/navigationUtils';
import SettingsSection from './SettingsSection';

const isSecure = typeof window !== 'undefined' && window.isSecureContext;

// Version, and the one thing people get stuck on: the camera needs HTTPS, which means trusting the home CA once.
function AboutSection() {
  return (
    <SettingsSection title="About">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-muted-foreground">App</dt>
        <dd>{APP_NAME}</dd>
        <dt className="text-muted-foreground">Version</dt>
        <dd className="tabular-nums">{__APP_VERSION__}</dd>
        <dt className="text-muted-foreground">Connection</dt>
        <dd>{isSecure ? 'Secure (camera and install available)' : 'Not secure: the camera scanner is off'}</dd>
      </dl>
      {isSecure ? null : (
        <p className="text-sm text-muted-foreground">
          Open the app over HTTPS. On the home server that means trusting its certificate once on this device; the steps
          are in the project README under &ldquo;Trusting the certificate&rdquo;.
        </p>
      )}
    </SettingsSection>
  );
}

export default AboutSection;
