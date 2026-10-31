import { KeyRound } from 'lucide-react';
import { Button } from '@components/ui/button';

type Props = {
  username: string | null;
  onEdit: () => void;
};

const HEADING_ID = 'security-password';

// The password next to the passkeys: which username signs in with it, or that there is none yet.
function PasswordSettings({ username, onEdit }: Props) {
  return (
    <section aria-labelledby={HEADING_ID} className="flex flex-col gap-2">
      <h3 id={HEADING_ID} className="text-sm font-medium">
        Password
      </h3>
      {username ? (
        <p className="text-sm text-muted-foreground">
          Sign in as <strong className="font-semibold text-foreground">{username}</strong> with your password.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          No password yet. Set one to sign in on a device that has none of your passkeys.
        </p>
      )}
      <Button variant="secondary" className="self-start" onClick={onEdit}>
        <KeyRound data-icon="inline-start" aria-hidden="true" />
        {username ? 'Change password' : 'Set a password'}
      </Button>
    </section>
  );
}

export default PasswordSettings;
