import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { KeyboardShortcutsPanel } from './KeyboardShortcutsPanel';
import { SettingsSidebar } from './SettingsSidebar';
import { AISettingsPanel } from './AISettingsPanel';
import { AppearanceSettingsPanel } from './AppearanceSettingsPanel';
import { DeveloperSettingsPanel } from './DeveloperSettingsPanel';
import { LicensePanel } from './LicensePanel';
import { AboutPanel } from './AboutPanel';
import { type SettingsCategory, settingsCategories } from './constants/settingsCategories';

interface SettingsViewProps {
  onClose: () => void;
}

export function SettingsView({ onClose }: SettingsViewProps) {
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('ai');

  return (
    <div className="fixed inset-0 top-[38px] bg-background z-[9999] flex">
      {}
      <SettingsSidebar activeCategory={activeCategory} onCategoryChange={setActiveCategory} />

      {}
      <div className="flex-1 flex flex-col">
        {}
        <div className="h-[38px] border-b border-border/40 flex items-center justify-between px-6">
          <h2 className="text-lg font-semibold">
            {settingsCategories.find((c) => c.id === activeCategory)?.label}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {}
        <div className="flex-1 overflow-auto p-6">
          {activeCategory === 'ai' && <AISettingsPanel />}
          {activeCategory === 'appearance' && <AppearanceSettingsPanel />}
          {activeCategory === 'shortcuts' && <KeyboardShortcutsPanel />}
          {activeCategory === 'developer' && <DeveloperSettingsPanel />}
          {activeCategory === 'license' && <LicensePanel />}
          {activeCategory === 'about' && <AboutPanel />}
        </div>
      </div>
    </div>
  );
}
