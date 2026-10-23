import { useLocation } from 'react-router';
import { ApiUrlParamsUtil } from '@app-types/utility';
import PaginationLinks from './components/PaginationLinks';
import { FIRST_PAGE } from './listPaginationUtils';

type Props = {
  page: number;
  size: number;
  total: number;
};

// "1–60 of 500" with prev/next; page numbers on desktop. Links keep every other URL param. Nothing for an empty list:
// the page's own empty state already says so.
function ListPagination({ page, size, total }: Props) {
  const { search } = useLocation();
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
      <PaginationLinks page={page} lastPage={lastPage} linkTo={linkTo} />
    </div>
  );
}

export default ListPagination;
