import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { useThemeStore } from '@/store/themeStore';
import { themeColors } from './constants/themeColors';

export function AppearanceSettingsPanel() {
  const { mode, color, dynamicNodeSizing, setMode, setColor, setDynamicNodeSizing } =
    useThemeStore();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold mb-1">Appearance Settings</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Customize the look and feel of the application.
        </p>
      </div>

      {}
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium mb-3 block">Theme Mode</Label>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setMode('light')}
              className={`
                flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all
                ${
                  mode === 'light'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-accent/50'
                }
              `}
            >
              <Sun className="w-6 h-6" />
              <div className="text-center">
                <div className="text-sm font-medium">Light</div>
                <div className="text-xs text-muted-foreground mt-0.5">Always light theme</div>
              </div>
            </button>

            <button
              onClick={() => setMode('dark')}
              className={`
                flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all
                ${
                  mode === 'dark'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-accent/50'
                }
              `}
            >
              <Moon className="w-6 h-6" />
              <div className="text-center">
                <div className="text-sm font-medium">Dark</div>
                <div className="text-xs text-muted-foreground mt-0.5">Always dark theme</div>
              </div>
            </button>

            <button
              onClick={() => setMode('system')}
              className={`
                flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all
                ${
                  mode === 'system'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-accent/50'
                }
              `}
            >
              <Monitor className="w-6 h-6" />
              <div className="text-center">
                <div className="text-sm font-medium">System</div>
                <div className="text-xs text-muted-foreground mt-0.5">Follow OS setting</div>
              </div>
            </button>
          </div>
        </div>

        {}
        <div>
          <Label className="text-sm font-medium mb-3 block">Accent Color</Label>
          <div className="grid grid-cols-4 gap-3">
            {themeColors.map((themeColor) => (
              <button
                key={themeColor.id}
                onClick={() => setColor(themeColor.id)}
                className={`
                  flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all
                  ${
                    color === themeColor.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-border/60 hover:bg-accent/50'
                  }
                `}
              >
                <div className={`w-8 h-8 rounded-full ${themeColor.preview} relative`}>
                  {color === themeColor.id && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="w-5 h-5 text-white drop-shadow-lg" />
                    </div>
                  )}
                </div>
                <div className="text-xs font-medium">{themeColor.name}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium mb-3 block">Graph Settings</Label>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-lg border border-border">
            <div>
              <Label htmlFor="dynamic-node-sizing" className="text-sm font-medium">
                Dynamic Node Sizing
              </Label>
              <p className="text-xs text-muted-foreground">
                Adjust node size based on the number of words in the node name
              </p>
            </div>
            <Switch
              id="dynamic-node-sizing"
              checked={dynamicNodeSizing}
              onCheckedChange={setDynamicNodeSizing}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
