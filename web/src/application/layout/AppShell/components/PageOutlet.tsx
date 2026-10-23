import { NavigationType, Outlet, useMatches, useNavigationType } from 'react-router';
import { cn } from '@utils/classNameUtils';
import { FADE_IN_CLASS } from '@utils/motionUtils';

type Props = {
  className?: string;
};

// The root route is match 0; the page under it (Funkos, one funko, a collection) is match 1.
const PAGE_MATCH_INDEX = 1;

// The page area. Links change pages with a view transition (index.css); Back and Forward do not go through a
// link, so here the new page fades in on those instead. It is keyed by the page's own path, so opening a dialog or
// form nested under the page, or changing a list's search and filters, does not replay it. Fade only, no slide: a
// transform here would carry the fixed Add button along while it runs.
function PageOutlet({ className }: Props) {
  const matches = useMatches();
  const pagePath = matches[PAGE_MATCH_INDEX]?.pathname;
  const isBackOrForward = useNavigationType() === NavigationType.Pop;

  return (
    <div key={pagePath} className={cn(isBackOrForward && FADE_IN_CLASS, className)}>
      <Outlet />
    </div>
  );
}

export default PageOutlet;
