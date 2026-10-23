import type { ReactNode } from 'react';
import AuthBackdrop from './components/AuthBackdrop';
import AuthCard from './components/AuthCard';

type Props = {
  // The box label on the logo: a word or two ("Collector only").
  label: string;
  title: string;
  description: ReactNode;
  // Small print under the card (help, a link elsewhere).
  footer?: ReactNode;
  children: ReactNode;
};

// The sign-in and first-run pages: outside the app shell, one centred card with the floating logo, the page's h1
// and its content. Phone-first: a 16px gutter, and the card never grows past a comfortable reading width.
function AuthLayout({ label, title, description, footer, children }: Props) {
  return (
    <div className="relative flex min-h-svh flex-col bg-background">
      <AuthBackdrop />
      <main className="relative flex flex-1 flex-col items-center justify-center gap-6 px-4 py-10">
        <AuthCard label={label} title={title} description={description}>
          {children}
        </AuthCard>
        {footer ? <div className="w-full max-w-sm text-center text-xs text-muted-foreground">{footer}</div> : null}
      </main>
    </div>
  );
}

export default AuthLayout;
