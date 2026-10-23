// The app's keyboard shortcuts, in one place: the handlers and the Settings → Shortcuts card read these.
export const SEARCH_SHORTCUT_KEY = 'k';
// Fixed by shadcn's sidebar (SIDEBAR_KEYBOARD_SHORTCUT in ui/sidebar.tsx, vendored); kept equal to it here.
export const SIDEBAR_SHORTCUT_KEY = 'b';

const MAC_PLATFORM = /Mac|iPhone|iPad/i;

// ⌘ on Apple devices, Ctrl everywhere else: the key the shortcuts pair with on this device.
export const MODIFIER_KEY_LABEL =
  typeof navigator !== 'undefined' && MAC_PLATFORM.test(navigator.userAgent) ? '⌘' : 'Ctrl';
