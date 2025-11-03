import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Keyboard } from "lucide-react";
import { useState } from "react";

interface Shortcut {
  key: string;
  description: string;
}

interface KeyboardShortcutsProps {
  shortcuts: Shortcut[];
  title?: string;
}

export function KeyboardShortcuts({ shortcuts, title = "Keyboard Shortcuts" }: KeyboardShortcutsProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsVisible(!isVisible)}
        title="Show keyboard shortcuts"
      >
        <Keyboard className="w-4 h-4" />
      </Button>

      {isVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Keyboard className="w-5 h-5 mr-2" />
                {title}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
              >
                ✕
              </Button>
            </div>
            <div className="space-y-2">
              {shortcuts.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <span className="text-sm text-muted-foreground">
                    {shortcut.description}
                  </span>
                  <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
