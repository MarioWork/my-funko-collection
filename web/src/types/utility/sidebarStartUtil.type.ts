// How the desktop sidebar opens when the app loads: wide with labels, or icons only.
export const SidebarStartUtil = {
  EXPANDED: 'expanded',
  COLLAPSED: 'collapsed',
} as const;

export type SidebarStartUtil = (typeof SidebarStartUtil)[keyof typeof SidebarStartUtil];
