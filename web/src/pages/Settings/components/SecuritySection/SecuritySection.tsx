import { useState } from 'react';
import type { PasskeyApiModel } from '@app-types/models';
import { Separator } from '@components/ui/separator';
import { useSignedInUser } from './hooks/useSignedInUser';
import SettingsSection from '../SettingsSection';
import AddPasskeyDialog from './components/AddPasskeyDialog';
import PasskeyList from './components/PasskeyList';
import RemovePasskeyDialog from './components/RemovePasskeyDialog';
import SignOutActions from './components/SignOutActions';

type Props = {
  passkeys: PasskeyApiModel[];
};

// Who is signed in, the passkeys that can sign in (add, remove), and signing out. The dialogs mount only while
// open, so each opening starts fresh.
function SecuritySection({ passkeys }: Props) {
  const user = useSignedInUser();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [passkeyToRemove, setPasskeyToRemove] = useState<PasskeyApiModel | null>(null);

  return (
    <SettingsSection
      title="Security"
      description="You sign in with a passkey: Face ID, Touch ID or a passkey manager. No password to forget."
    >
      {user.name ? (
        <p className="text-sm">
          Signed in as <strong className="font-semibold">{user.name}</strong>.
        </p>
      ) : null}
      <PasskeyList passkeys={passkeys} onAdd={() => setIsAddOpen(true)} onRemove={setPasskeyToRemove} />
      <Separator />
      <SignOutActions />
      {isAddOpen ? <AddPasskeyDialog onClose={() => setIsAddOpen(false)} /> : null}
      {passkeyToRemove ? (
        <RemovePasskeyDialog
          key={passkeyToRemove.id}
          passkey={passkeyToRemove}
          onClose={() => setPasskeyToRemove(null)}
        />
      ) : null}
    </SettingsSection>
  );
}

export default SecuritySection;
