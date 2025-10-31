import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useEditHandlers } from '../handlers/editHandlers';

interface EditShortcutsProviderProps {
  children: React.ReactNode;
  enabled?: boolean;
}

export const EditShortcutsProvider: React.FC<EditShortcutsProviderProps> = ({
  children,
  enabled = true,
}) => {
  const editHandlers = useEditHandlers();

  useKeyboardShortcuts({
    shortcuts: {
      'edit.undo': () => {
        editHandlers.undo();
      },
      'edit.redo': () => {
        editHandlers.redo();
      },
      'edit.copy': () => {
        editHandlers.copy();
      },
      'edit.paste': () => {
        editHandlers.paste();
      },
      'edit.cut': () => {
        editHandlers.cut();
      },
    },
    enabled,
  });

  return <>{children}</>;
};
