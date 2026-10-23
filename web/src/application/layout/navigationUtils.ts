import { Book, FolderHeart, House, Library, Package, Search, Tag, type LucideIcon } from 'lucide-react';
import {
  BASE_ROUTES_PATHS,
  CATEGORY_ROUTES_PATHS,
  COLLECTION_ROUTES_PATHS,
  FUNKO_ROUTES_PATHS,
  SERIES_ROUTES_PATHS,
  TAG_ROUTES_PATHS,
} from '@application/routes/routesUtils';

export type NavigationItem = {
  label: string;
  to: string;
  icon: LucideIcon;
};

// The four destinations of the bottom bar and the sidebar. "Add" is an action, so it is a button, never a tab.
export const NAVIGATION_ITEMS: NavigationItem[] = [
  { label: 'Home', to: BASE_ROUTES_PATHS.HOME, icon: House },
  { label: 'Funkos', to: FUNKO_ROUTES_PATHS.BASE, icon: Package },
  { label: 'Collections', to: COLLECTION_ROUTES_PATHS.BASE, icon: FolderHeart },
  { label: 'Search', to: BASE_ROUTES_PATHS.SEARCH, icon: Search },
];

// The manage pages: in the sidebar on desktop, under Settings on phones (the bottom bar keeps its four tabs).
export const MANAGE_ITEMS: NavigationItem[] = [
  { label: 'Categories', to: CATEGORY_ROUTES_PATHS.BASE, icon: Book },
  { label: 'Series', to: SERIES_ROUTES_PATHS.BASE, icon: Library },
  { label: 'Tags', to: TAG_ROUTES_PATHS.BASE, icon: Tag },
];

export const APP_NAME = 'MyFunkoCollection';
export const APP_SHORT_NAME = 'Funkos';
