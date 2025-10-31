import { type SettingsCategory, settingsCategories } from './constants/settingsCategories';

interface SettingsSidebarProps {
  activeCategory: SettingsCategory;
  onCategoryChange: (category: SettingsCategory) => void;
}

export function SettingsSidebar({ activeCategory, onCategoryChange }: SettingsSidebarProps) {
  return (
    <div className="w-[200px] border-r border-border bg-background/50 flex flex-col">
      <div className="flex-1 p-3 pt-4">
        <div className="mb-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
            Settings
          </h2>
        </div>
        <div className="space-y-1">
          {settingsCategories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  activeCategory === category.id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {category.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
