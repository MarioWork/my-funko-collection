import type { ComponentProps } from 'react';
import { Link } from 'react-router';
import { Button } from '@components/ui/button';

type Props = Omit<ComponentProps<typeof Button>, 'render' | 'nativeButton'> & {
  to: string;
};

// A button-styled link: it navigates, so it is an <a> underneath (middle-click and "open in new tab" work) and it
// keeps the link role; Base UI would otherwise announce it as a button.
function LinkButton({ to, ...props }: Props) {
  return <Button render={<Link to={to} />} nativeButton={false} role="link" {...props} />;
}

export default LinkButton;
