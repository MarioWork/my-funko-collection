import { pageNumbers } from '../listPaginationUtils';
import PageLink from './PageLink';

type Props = {
  page: number;
  lastPage: number;
  linkTo: (target: number) => string;
};

const DESKTOP_PAGE_LINKS = 7;

function PageNumbers({ page, lastPage, linkTo }: Props) {
  return pageNumbers(page, lastPage, DESKTOP_PAGE_LINKS).map((number) => (
    <PageLink key={number} to={linkTo(number)} label={`Page ${number}`} isCurrent={number === page}>
      {number}
    </PageLink>
  ));
}

export default PageNumbers;
