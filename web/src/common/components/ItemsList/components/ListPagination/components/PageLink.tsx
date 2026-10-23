import type { ReactNode } from 'react';
import { Link } from 'react-router';
import DisabledReason from '@components/DisabledReason';
import { Button } from '@components/ui/button';
import { PaginationItem } from '@components/ui/pagination';

type Props = {
  to: string;
  label: string;
  isCurrent?: boolean;
  isDisabled?: boolean;
  disabledReason?: string;
  children: ReactNode;
};

function PageLink({ to, label, isCurrent = false, isDisabled = false, disabledReason, children }: Props) {
  return (
    <PaginationItem>
      <DisabledReason reason={isDisabled ? disabledReason : undefined}>
        <Button
          variant={isCurrent ? 'outline' : 'ghost'}
          size="icon"
          aria-label={label}
          aria-current={isCurrent ? 'page' : undefined}
          disabled={isDisabled}
          render={<Link to={to} />}
          nativeButton={false}
        >
          {children}
        </Button>
      </DisabledReason>
    </PaginationItem>
  );
}

export default PageLink;
