import { useEffect, useState } from 'react';
import { SEARCH_SHORTCUT_KEY } from '@utils/keyboardUtils';

const PALETTE_KEY = SEARCH_SHORTCUT_KEY;

// ⌘K on Mac, Ctrl+K elsewhere, opens the palette from anywhere; Escape is handled by the dialog itself.
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === PALETTE_KEY;

      if (!isShortcut) return;

      event.preventDefault();
      setIsOpen((current) => !current);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { isOpen, setIsOpen };
}
