import type { ReactNode } from 'react';
import { cn } from '@utils/classNameUtils';
import { ENTER_UP_CLASS } from '@utils/motionUtils';
import FloatingLogo from './FloatingLogo';

type Props = {
  label: string;
  title: string;
  description: ReactNode;
  children: ReactNode;
};

// The card itself: the floating logo, the page's one h1 with its line of copy, then the page's content.
function AuthCard({ label, title, description, children }: Props) {
  return (
    <section
      className={cn(
        'flex w-full max-w-sm flex-col items-center gap-6 rounded-3xl border bg-card px-5 py-8 text-center shadow-xl shadow-primary/5 sm:px-8',
        ENTER_UP_CLASS,
      )}
    >
      <FloatingLogo label={label} />
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-extrabold tracking-tight text-balance">{title}</h1>
        <p className="text-sm text-balance text-muted-foreground">{description}</p>
      </header>
      <div className="flex w-full flex-col gap-4 text-left">{children}</div>
    </section>
  );
}

export default AuthCard;
