import type { ReactNode } from 'react';
import { buttonVariants } from '@components/ui/button';
import { cn } from '@utils/classNameUtils';

type Props = {
  href: string;
  children: ReactNode;
  variant?: 'outline' | 'secondary' | 'default';
  className?: string;
};

// A plain anchor styled as a button: the browser downloads the file (an API export), nothing to render in React.
function DownloadLink({ href, children, variant = 'outline', className }: Props) {
  return (
    <a href={href} download className={cn(buttonVariants({ variant }), className)}>
      {children}
    </a>
  );
}

export default DownloadLink;
