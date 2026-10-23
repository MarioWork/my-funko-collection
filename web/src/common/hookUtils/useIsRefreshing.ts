import { useLocation, useNavigation } from 'react-router';

// True while this same page reloads its data: a list's search, filter, sort or page changed and its loader is
// running. Going to another page is the top loading bar's job, and writes (fetchers) do not count.
export function useIsRefreshing(): boolean {
  const navigation = useNavigation();
  const location = useLocation();
  const isLoading = navigation.state === 'loading';
  const isSamePage = navigation.location?.pathname === location.pathname;

  return isLoading && isSamePage;
}
