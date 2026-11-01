import type { ComponentProps } from 'react';
import { Link } from 'react-router';
import DisabledReason from '@components/DisabledReason';
import { Button } from '@components/ui/button';

type Props = Omit<ComponentProps<typeof Button>, 'render' | 'nativeButton' | 'disabled'> & {
  to: string;
  // Why it can't be followed now (a read-only user's "New ..." link): it then renders as a disabled button that
  // says why on hover, keyboard focus and tap, instead of a link to a page whose save would be refused.
  disabledReason?: string;
};

// A button-styled link: it navigates, so it is an <a> underneath (middle-click and "open in new tab" work) and it
// keeps the link role; Base UI would otherwise announce it as a button.
function LinkButton({ to, disabledReason, ...props }: Props) {
  if (disabledReason) {
    return (
      <DisabledReason reason={disabledReason}>
        <Button disabled {...props} />
      </DisabledReason>
    );
  }

  return <Button render={<Link viewTransition to={to} />} nativeButton={false} role="link" {...props} />;
}

export default LinkButton;
