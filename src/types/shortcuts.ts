export type KeyboardShortcutAction =
  | 'graph.new'
  | 'graph.save'
  | 'graph.delete'
  | 'graph.export'
  | 'graph.import'
  | 'view.zoom-in'
  | 'view.zoom-out'
  | 'view.zoom-reset'
  | 'view.fit-to-screen'
  | 'view.pan-up'
  | 'view.pan-down'
  | 'view.pan-left'
  | 'view.pan-right'
  | 'edit.undo'
  | 'edit.redo'
  | 'edit.copy'
  | 'edit.paste'
  | 'edit.cut';

export interface KeyboardShortcut {
  action: KeyboardShortcutAction;
  keys: string[];
  description: string;
  category: 'graph' | 'view' | 'edit';
  enabled: boolean;
}

export interface KeyboardShortcutConfig {
  shortcuts: Record<KeyboardShortcutAction, KeyboardShortcut>;
}

export const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  {
    action: 'graph.new',
    keys: ['Mod', 'N'],
    description: 'Create new graph',
    category: 'graph',
    enabled: true,
  },
  {
    action: 'graph.save',
    keys: ['Mod', 'S'],
    description: 'Save current graph',
    category: 'graph',
    enabled: true,
  },
  {
    action: 'graph.delete',
    keys: ['Mod', 'Shift', 'Backspace'],
    description: 'Delete current graph (Cmd+Shift+Delete/Backspace)',
    category: 'graph',
    enabled: true,
  },
  {
    action: 'graph.export',
    keys: ['Mod', 'E'],
    description: 'Export graph',
    category: 'graph',
    enabled: true,
  },
  {
    action: 'graph.import',
    keys: ['Mod', 'I'],
    description: 'Import graph',
    category: 'graph',
    enabled: true,
  },

  {
    action: 'view.zoom-in',
    keys: ['Mod', 'Shift', '='],
    description: 'Zoom in (Cmd+Shift+=)',
    category: 'view',
    enabled: true,
  },
  {
    action: 'view.zoom-out',
    keys: ['Mod', 'Shift', '-'],
    description: 'Zoom out (Cmd+Shift+-)',
    category: 'view',
    enabled: true,
  },
  {
    action: 'view.zoom-reset',
    keys: ['Mod', '0'],
    description: 'Reset zoom',
    category: 'view',
    enabled: true,
  },
  {
    action: 'view.fit-to-screen',
    keys: ['Mod', 'Shift', 'F'],
    description: 'Fit graph to screen (Cmd+Shift+F)',
    category: 'view',
    enabled: true,
  },
  {
    action: 'view.pan-up',
    keys: ['ArrowUp'],
    description: 'Pan view up',
    category: 'view',
    enabled: true,
  },
  {
    action: 'view.pan-down',
    keys: ['ArrowDown'],
    description: 'Pan view down',
    category: 'view',
    enabled: true,
  },
  {
    action: 'view.pan-left',
    keys: ['ArrowLeft'],
    description: 'Pan view left',
    category: 'view',
    enabled: true,
  },
  {
    action: 'view.pan-right',
    keys: ['ArrowRight'],
    description: 'Pan view right',
    category: 'view',
    enabled: true,
  },

  {
    action: 'edit.undo',
    keys: ['Mod', 'Z'],
    description: 'Undo',
    category: 'edit',
    enabled: true,
  },
  {
    action: 'edit.redo',
    keys: ['Mod', 'Shift', 'Z'],
    description: 'Redo',
    category: 'edit',
    enabled: true,
  },
  {
    action: 'edit.copy',
    keys: ['Mod', 'C'],
    description: 'Copy',
    category: 'edit',
    enabled: true,
  },
  {
    action: 'edit.paste',
    keys: ['Mod', 'V'],
    description: 'Paste',
    category: 'edit',
    enabled: true,
  },
  {
    action: 'edit.cut',
    keys: ['Mod', 'X'],
    description: 'Cut',
    category: 'edit',
    enabled: true,
  },
];

export function formatShortcutKeys(keys: string[]): string {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  return keys
    .map((key) => {
      if (key === 'Mod') return isMac ? '⌘' : 'Ctrl';
      if (key === 'Alt') return isMac ? '⌥' : 'Alt';
      if (key === 'Shift') return '⇧';
      if (key === 'Delete') return '⌫';
      if (key === 'Enter') return '↵';
      if (key === 'ArrowUp') return '↑';
      if (key === 'ArrowDown') return '↓';
      if (key === 'ArrowLeft') return '←';
      if (key === 'ArrowRight') return '→';
      return key;
    })
    .join(isMac ? '' : '+');
}

export function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const keys = shortcut.keys;

  const needsMod = keys.includes('Mod');
  const needsShift = keys.includes('Shift');
  const needsAlt = keys.includes('Alt');

  const hasMod = isMac ? event.metaKey : event.ctrlKey;
  const hasShift = event.shiftKey;
  const hasAlt = event.altKey;

  if (needsMod && !hasMod) return false;
  if (!needsMod && hasMod) return false;
  if (needsShift && !hasShift) return false;
  if (!needsShift && hasShift) return false;
  if (needsAlt && !hasAlt) return false;
  if (!needsAlt && hasAlt) return false;

  const keyToCheck = keys.find((k) => k !== 'Mod' && k !== 'Shift' && k !== 'Alt');
  if (!keyToCheck) return false;

  if (keyToCheck.toLowerCase() === 'backspace' && event.key === 'Delete') {
    return true;
  }
  if (keyToCheck.toLowerCase() === 'delete' && event.key === 'Backspace') {
    return true;
  }

  return event.key.toLowerCase() === keyToCheck.toLowerCase();
}
