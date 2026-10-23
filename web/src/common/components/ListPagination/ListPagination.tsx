import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { ApiUrlParamsUtil } from '@app-types/utility';
import { Button } from '@components/ui/button';
import { Pagination, PaginationContent, PaginationItem } from '@components/ui/pagination';
import { useIsDesktop } from '@hooks/useMediaQuery';
import DisabledReason from '@components/DisabledReason';

type Props = {
  page: number;
  size: number;
  total: number;
};

type PageLinkProps = {
  to: string;
  label: string;
  isCurrent?: boolean;
  isDisabled?: boolean;
  disabledReason?: string;
  children: ReactNode;
};

const FIRST_PAGE = 1;
const DESKTOP_PAGE_LINKS = 7;

function pageNumbers(current: number, last: number, visible: number): number[] {
  const half = Math.floor(visible / 2);
  const start = Math.max(FIRST_PAGE, Math.min(current - half, last - visible + 1));
  const end = Math.min(last, start + visible - 1);

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function PageLink({ to, label, isCurrent = false, isDisabled = false, disabledReason, children }: PageLinkProps) {
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

type PageNumbersProps = {
  page: number;
  lastPage: number;
  linkTo: (target: number) => string;
};

function PageNumbers({ page, lastPage, linkTo }: PageNumbersProps) {
  return pageNumbers(page, lastPage, DESKTOP_PAGE_LINKS).map((number) => (
    <PageLink key={number} to={linkTo(number)} label={`Page ${number}`} isCurrent={number === page}>
      {number}
    </PageLink>
  ));
}

// "1–60 of 500" with prev/next; page numbers on desktop. Links keep every other URL param. Nothing for an empty list:
// the page's own empty state already says so.
function ListPagination({ page, size, total }: Props) {
  const { search } = useLocation();
  const isDesktop = useIsDesktop();
  const lastPage = Math.max(FIRST_PAGE, Math.ceil(total / size));
  const first = (page - 1) * size + 1;
  const last = Math.min(page * size, total);

  const linkTo = (target: number): string => {
    const params = new URLSearchParams(search);

    params.set(ApiUrlParamsUtil.page, String(target));

    return `?${params.toString()}`;
  };

  if (total === 0) return null;

  if (total <= size) return <p className="text-sm text-muted-foreground">{total} results</p>;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground tabular-nums">
        {first}–{last} of {total}
      </p>
      <Pagination className="mx-0 w-auto">
        <PaginationContent>
          <PageLink
            to={linkTo(page - 1)}
            label="Previous page"
            isDisabled={page <= FIRST_PAGE}
            disabledReason="You are on the first page."
          >
            <ChevronLeft aria-hidden="true" />
          </PageLink>
          {isDesktop ? <PageNumbers page={page} lastPage={lastPage} linkTo={linkTo} /> : null}
          <PageLink
            to={linkTo(page + 1)}
            label="Next page"
            isDisabled={page >= lastPage}
            disabledReason="You are on the last page."
          >
            <ChevronRight aria-hidden="true" />
          </PageLink>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

export default ListPagination;
