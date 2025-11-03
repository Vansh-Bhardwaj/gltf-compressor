import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useThemeStore } from "@/stores/useThemeStore";
import { AppTheme } from "@/types/types";
import defaultThemeData from "@/themes/default.json";
import shopifyThemeData from "@/themes/shopify.json";

type Theme = "dark" | "light" | "system";

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  const { loadTheme, setActiveTheme } = useThemeStore();
  const effectiveTheme = useThemeStore((state) => state.getEffectiveTheme());

  // Load built-in themes on mount
  useEffect(() => {
    loadTheme(defaultThemeData as unknown as AppTheme);
    loadTheme(shopifyThemeData as unknown as AppTheme);

    // Set active theme from localStorage or default
    const savedThemeId = localStorage.getItem("active-theme-id");
    setActiveTheme(savedThemeId || "default");
  }, [loadTheme, setActiveTheme]);

  // Inject CSS variables when effective theme changes
  useEffect(() => {
    if (!effectiveTheme) return;

    const root = window.document.documentElement;

    // Only apply custom theme colors if they differ from defaults
    // This allows the base Tailwind dark/light mode to work
    if (effectiveTheme.id !== "default") {
      // Apply color variables only for non-default themes
      Object.entries(effectiveTheme.colors).forEach(([key, value]) => {
        const cssVarName = `--${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`;
        root.style.setProperty(cssVarName, value);
      });
    } else {
      // For default theme, remove custom overrides to let CSS take over
      Object.keys(effectiveTheme.colors).forEach((key) => {
        const cssVarName = `--${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`;
        root.style.removeProperty(cssVarName);
      });
    }

    // Apply typography
    if (effectiveTheme.typography.fontFamily) {
      root.style.setProperty(
        "--font-family",
        effectiveTheme.typography.fontFamily
      );
    }
    if (effectiveTheme.typography.baseFontSize) {
      root.style.setProperty(
        "--font-size-base",
        `${effectiveTheme.typography.baseFontSize}px`
      );
    }

    if (effectiveTheme.typography.headingFontFamily) {
      root.style.setProperty(
        "--font-family-heading",
        effectiveTheme.typography.headingFontFamily
      );
    }

    // Apply component-level customizations
    if (effectiveTheme.components?.button?.borderRadius) {
      root.style.setProperty(
        "--button-border-radius",
        effectiveTheme.components.button.borderRadius
      );
    }

    if (effectiveTheme.components?.card?.borderRadius) {
      root.style.setProperty(
        "--card-border-radius",
        effectiveTheme.components.card.borderRadius
      );
    }
  }, [effectiveTheme]);

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme: (theme: Theme) => {
        localStorage.setItem(storageKey, theme);
        setTheme(theme);
      },
    }),
    [theme, storageKey]
  );

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
