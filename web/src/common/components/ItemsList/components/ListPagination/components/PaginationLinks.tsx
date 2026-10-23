import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Pagination, PaginationContent } from '@components/ui/pagination';
import { useIsDesktop } from '@hooks/useIsDesktop';
import { FIRST_PAGE } from '../listPaginationUtils';
import PageLink from './PageLink';
import PageNumbers from './PageNumbers';

type Props = {
  page: number;
  lastPage: number;
  linkTo: (target: number) => string;
};

// Previous and next, with the page numbers between them on desktop.
function PaginationLinks({ page, lastPage, linkTo }: Props) {
  const isDesktop = useIsDesktop();

  return (
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
  );
}

export default PaginationLinks;
