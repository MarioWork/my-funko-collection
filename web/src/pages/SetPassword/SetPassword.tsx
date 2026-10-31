import { useLoaderData } from 'react-router';
import type { LoaderDataUtil } from '@app-types/utility';
import AuthLayout from '@components/AuthLayout';
import SetOwnPasswordForm from './components/SetOwnPasswordForm';
import SignOutButton from './components/SignOutButton';
import type { loader } from './setPasswordLoader';

// Outside the app shell, where the app sends a user signed in with a temporary password an admin made: they choose
// their own before anything else (the API refuses every other request until then).
function SetPassword() {
  const { user } = useLoaderData<LoaderDataUtil<typeof loader>>();

  return (
    <AuthLayout
      label="New here"
      title="Choose your password"
      description="You signed in with a temporary password. Pick your own to open your collection."
      footer="Your temporary password stops working once you save this one."
    >
      <SetOwnPasswordForm username={user.username} />
      <SignOutButton />
    </AuthLayout>
  );
}

export default SetPassword;
