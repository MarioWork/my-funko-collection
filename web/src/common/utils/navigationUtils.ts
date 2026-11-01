import {
  Book,
  FolderHeart,
  House,
  Images,
  Inbox,
  Library,
  Package,
  Search,
  Settings,
  Tag,
  Users,
  type LucideIcon,
} from 'lucide-react';
import {
  BASE_ROUTES_PATHS,
  CATEGORY_ROUTES_PATHS,
  COLLECTION_ROUTES_PATHS,
  FUNKO_ROUTES_PATHS,
  IMAGE_ROUTES_PATHS,
  SERIES_ROUTES_PATHS,
  SUBMISSION_ROUTES_PATHS,
  TAG_ROUTES_PATHS,
  USER_ROUTES_PATHS,
} from '@application/routes/routesUtils';

// One icon per page, shared by the sidebar, the bottom bar and each page's title (PageHeader).
export const PAGE_ICONS = {
  HOME: House,
  FUNKOS: Package,
  COLLECTIONS: FolderHeart,
  SEARCH: Search,
  CATEGORIES: Book,
  SERIES: Library,
  TAGS: Tag,
  IMAGES: Images,
  USERS: Users,
  SUBMISSIONS: Inbox,
  SETTINGS: Settings,
} satisfies Record<string, LucideIcon>;

export type NavigationItem = {
  label: string;
  to: string;
  icon: LucideIcon;
};

// The four destinations of the bottom bar and the sidebar. "Add" is an action, so it is a button, never a tab.
export const NAVIGATION_ITEMS: NavigationItem[] = [
  { label: 'Home', to: BASE_ROUTES_PATHS.HOME, icon: PAGE_ICONS.HOME },
  { label: 'Funkos', to: FUNKO_ROUTES_PATHS.BASE, icon: PAGE_ICONS.FUNKOS },
  { label: 'Collections', to: COLLECTION_ROUTES_PATHS.BASE, icon: PAGE_ICONS.COLLECTIONS },
  { label: 'Search', to: BASE_ROUTES_PATHS.SEARCH, icon: PAGE_ICONS.SEARCH },
];

// The manage pages: in the sidebar on desktop, under Settings on phones (the bottom bar keeps its four tabs).
export const MANAGE_ITEMS: NavigationItem[] = [
  { label: 'Categories', to: CATEGORY_ROUTES_PATHS.BASE, icon: PAGE_ICONS.CATEGORIES },
  { label: 'Series', to: SERIES_ROUTES_PATHS.BASE, icon: PAGE_ICONS.SERIES },
  { label: 'Tags', to: TAG_ROUTES_PATHS.BASE, icon: PAGE_ICONS.TAGS },
];

// A member's own submissions, after the manage pages. An admin's new funkos join the catalogue at once, so an admin
// has none and never sees it.
export const SUBMISSIONS_ITEM: NavigationItem = {
  label: 'Submissions',
  to: SUBMISSION_ROUTES_PATHS.BASE,
  icon: PAGE_ICONS.SUBMISSIONS,
};

// The manage pages, plus Submissions for a member.
export function manageItemsFor(isAdmin: boolean): NavigationItem[] {
  if (isAdmin) return MANAGE_ITEMS;

  return [...MANAGE_ITEMS, SUBMISSIONS_ITEM];
}

// The Admin group: pages only an admin sees (the sidebar on desktop, the phone menu), under ADMIN_GROUP_LABEL.
export const ADMIN_GROUP_LABEL = 'Admin';

// Submissions here is every member's, to review (Waiting and Done).
export const ADMIN_ITEMS: NavigationItem[] = [
  { label: 'Submissions', to: SUBMISSION_ROUTES_PATHS.REVIEW, icon: PAGE_ICONS.SUBMISSIONS },
  { label: 'Users', to: USER_ROUTES_PATHS.BASE, icon: PAGE_ICONS.USERS },
  { label: 'Images', to: IMAGE_ROUTES_PATHS.BASE, icon: PAGE_ICONS.IMAGES },
];

// Settings: the sidebar's footer on desktop, the last entry of the phone menu.
export const SETTINGS_ITEM: NavigationItem = {
  label: 'Settings',
  to: BASE_ROUTES_PATHS.SETTINGS,
  icon: PAGE_ICONS.SETTINGS,
};

export const APP_NAME = 'MyFunkoCollection';
