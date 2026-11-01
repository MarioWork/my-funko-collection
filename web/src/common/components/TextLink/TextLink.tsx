import type { ReactNode } from 'react';
import { Link } from 'react-router';

type Props = {
  to: string;
  children: ReactNode;
};

// A link inside a line of muted text (a maybe-double, "Merged into ..."): underlined, in the foreground colour, with
// a focus ring.
function TextLink({ to, children }: Props) {
  return (
    <Link
      viewTransition
      to={to}
      className="font-medium text-foreground underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </Link>
  );
}

export default TextLink;
