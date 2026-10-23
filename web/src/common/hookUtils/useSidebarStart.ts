import { SidebarStartUtil } from '@app-types/utility';
import { useLocalStorage, type LocalStorageState } from '@hooks/useLocalStorage';

const SIDEBAR_START_STORAGE_KEY = 'funkos.sidebarStart';

// The Settings preference for how the desktop sidebar opens; kept on this device, like the theme.
export function useSidebarStart(): LocalStorageState<SidebarStartUtil> {
  return useLocalStorage<SidebarStartUtil>(SIDEBAR_START_STORAGE_KEY, SidebarStartUtil.EXPANDED);
}
