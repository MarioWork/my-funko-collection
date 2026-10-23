import { Kbd, KbdGroup } from '@components/ui/kbd';
import { MODIFIER_KEY_LABEL, SEARCH_SHORTCUT_KEY, SIDEBAR_SHORTCUT_KEY } from '@utils/keyboardUtils';
import SettingsSection from './SettingsSection';

type Shortcut = {
  keys: string[];
  // What it does, and where it works when not everywhere.
  action: string;
};

type ShortcutRowProps = {
  shortcut: Shortcut;
};

const SHORTCUTS: Shortcut[] = [
  { keys: [MODIFIER_KEY_LABEL, SEARCH_SHORTCUT_KEY.toUpperCase()], action: 'Search everything, from any page' },
  { keys: [MODIFIER_KEY_LABEL, SIDEBAR_SHORTCUT_KEY.toUpperCase()], action: 'Collapse or expand the sidebar' },
  { keys: ['←', '→'], action: 'Previous or next photo, in the photo viewer' },
  { keys: ['Esc'], action: 'Close a dialog, a menu or the photo viewer' },
  { keys: ['Enter'], action: 'Create, in the new category or series box' },
];

// The keys first, then what they do. A key pair is one group, read as "⌘ K".
function ShortcutRow({ shortcut }: ShortcutRowProps) {
  return (
    <>
      <dt>
        <KbdGroup>
          {shortcut.keys.map((key) => (
            <Kbd key={key}>{key}</Kbd>
          ))}
        </KbdGroup>
      </dt>
      <dd className="text-sm">{shortcut.action}</dd>
    </>
  );
}

// Every keyboard shortcut the app has, with this device's modifier key (⌘ on a Mac, Ctrl elsewhere).
function ShortcutsSection() {
  return (
    <SettingsSection title="Shortcuts" description="With a keyboard.">
      <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2">
        {SHORTCUTS.map((shortcut) => (
          <ShortcutRow key={shortcut.action} shortcut={shortcut} />
        ))}
      </dl>
    </SettingsSection>
  );
}

export default ShortcutsSection;
