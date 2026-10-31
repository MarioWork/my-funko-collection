import AuthLayout from '@components/AuthLayout';
import LockedOutHelp from './components/LockedOutHelp';
import OrDivider from './components/OrDivider';
import PasskeySignIn from './components/PasskeySignIn';
import PasswordSignInForm from './components/PasswordSignInForm';

// Outside the app shell. A passkey or a username and password: both submit to this route's action, which signs in
// and redirects back to where the user was.
function Login() {
  return (
    <AuthLayout
      label="Collector only"
      title="Welcome back!"
      description="Your shelves missed you. Sign in to see your collection."
      footer="Only you can open this collection."
    >
      <PasskeySignIn />
      <OrDivider />
      <PasswordSignInForm />
      <LockedOutHelp />
    </AuthLayout>
  );
}

export default Login;
