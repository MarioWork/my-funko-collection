import { ChevronRight, LifeBuoy } from 'lucide-react';
import { RESET_COMMAND } from '../loginUtils';

// Native <details>: keyboard and screen-reader friendly with no script, closed until someone needs it.
function LockedOutHelp() {
  return (
    <details className="group rounded-xl border bg-muted/50 text-sm">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl px-3 font-medium outline-none select-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        <LifeBuoy className="size-4 text-primary" aria-hidden="true" />
        Locked out?
        <ChevronRight
          className="ml-auto size-4 text-muted-foreground transition-transform group-open:rotate-90"
          aria-hidden="true"
        />
      </summary>
      <div className="flex flex-col gap-2 px-3 pb-3 text-muted-foreground">
        <p>Lost every passkey and can&apos;t sign in with a password? On the server, run:</p>
        <code className="block rounded-lg bg-background px-3 py-2 font-mono text-xs text-foreground">
          {RESET_COMMAND}
        </code>
        <p>
          It removes every passkey, password and sign-in, then prints a new setup link. Your funkos stay exactly where
          they are.
        </p>
      </div>
    </details>
  );
}

export default LockedOutHelp;
