import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
  global?: boolean; // If true, works even when inputs are focused
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled: boolean = true) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger shortcuts when typing in inputs (unless global)
    const isTyping = event.target instanceof HTMLInputElement || 
                    event.target instanceof HTMLTextAreaElement ||
                    (event.target as any)?.contentEditable === 'true';

    for (const shortcut of shortcuts) {
      if (isTyping && !shortcut.global) continue;

      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatches = !!shortcut.ctrlKey === !!event.ctrlKey;
      const metaMatches = !!shortcut.metaKey === !!event.metaKey;
      const shiftMatches = !!shortcut.shiftKey === !!event.shiftKey;
      const altMatches = !!shortcut.altKey === !!event.altKey;

      if (keyMatches && ctrlMatches && metaMatches && shiftMatches && altMatches) {
        event.preventDefault();
        event.stopPropagation();
        shortcut.action();
        break;
      }
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Global shortcuts that work across the entire app
export function useGlobalShortcuts() {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'k',
      metaKey: true,
      action: () => {
        // Trigger command palette
        window.dispatchEvent(new CustomEvent('openCommandPalette'));
      },
      description: 'Open command palette',
      global: true
    },
    {
      key: 'k',
      ctrlKey: true,
      action: () => {
        // Trigger command palette for Windows/Linux
        window.dispatchEvent(new CustomEvent('openCommandPalette'));
      },
      description: 'Open command palette',
      global: true
    },
    {
      key: '/',
      action: () => {
        // Focus search input
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      },
      description: 'Focus search',
      global: true
    },
    {
      key: 'Escape',
      action: () => {
        // Close modals, clear focus
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && activeElement !== document.body) {
          activeElement.blur();
        }
        // Dispatch escape event for modals to listen
        window.dispatchEvent(new CustomEvent('globalEscape'));
      },
      description: 'Escape/Close',
      global: true
    }
  ];

  useKeyboardShortcuts(shortcuts, true);
}

// Page-specific shortcuts
export function usePageShortcuts(page: string) {
  const getPageShortcuts = (page: string): KeyboardShortcut[] => {
    switch (page) {
      case 'inventory':
        return [
          {
            key: 'n',
            action: () => window.dispatchEvent(new CustomEvent('addNewProduct')),
            description: 'Add new product'
          },
          {
            key: 'b',
            action: () => window.history.back(),
            description: 'Go back'
          },
          {
            key: 'r',
            action: () => window.location.reload(),
            description: 'Refresh page'
          },
          {
            key: 'f',
            action: () => {
              const filterButton = document.querySelector('[data-filter-toggle]') as HTMLElement;
              if (filterButton) filterButton.click();
            },
            description: 'Toggle filters'
          },
          {
            key: 'a',
            ctrlKey: true,
            action: () => window.dispatchEvent(new CustomEvent('selectAll')),
            description: 'Select all items'
          }
        ];
      default:
        return [
          {
            key: 'b',
            action: () => window.history.back(),
            description: 'Go back'
          },
          {
            key: 'r',
            action: () => window.location.reload(),
            description: 'Refresh page'
          }
        ];
    }
  };

  const shortcuts = getPageShortcuts(page);
  useKeyboardShortcuts(shortcuts, true);

  return shortcuts;
}
