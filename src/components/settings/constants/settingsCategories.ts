import { Sparkles, Palette, Info, Keyboard, Code, Scale } from 'lucide-react';

export type SettingsCategory =
  | 'ai'
  | 'appearance'
  | 'shortcuts'
  | 'license'
  | 'about'
  | 'developer';

export const settingsCategories = [
  { id: 'ai' as const, label: 'AI', icon: Sparkles },
  { id: 'appearance' as const, label: 'Appearance', icon: Palette },
  { id: 'shortcuts' as const, label: 'Shortcuts', icon: Keyboard },
  { id: 'license' as const, label: 'License', icon: Scale },
  { id: 'about' as const, label: 'About', icon: Info },
  { id: 'developer' as const, label: 'Developer', icon: Code },
];
