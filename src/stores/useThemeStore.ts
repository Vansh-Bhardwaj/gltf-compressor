import { AppTheme } from "@/types/types";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

interface ThemeStore {
  activeThemeId: string;
  activeTheme: AppTheme | null;
  previewTheme: AppTheme | null;
  availableThemes: Map<string, AppTheme>;
  setActiveTheme: (themeId: string) => void;
  setPreviewTheme: (theme: AppTheme | null) => void;
  loadTheme: (theme: AppTheme) => void;
  getEffectiveTheme: () => AppTheme | null;
}

export const useThemeStore = create<ThemeStore>()(
  subscribeWithSelector((set, get) => ({
    activeThemeId: "default",
    activeTheme: null,
    previewTheme: null,
    availableThemes: new Map<string, AppTheme>(),

    setActiveTheme: (themeId: string) => {
      const theme = get().availableThemes.get(themeId);
      if (theme) {
        set({ activeThemeId: themeId, activeTheme: theme });
        localStorage.setItem("active-theme-id", themeId);
      }
    },

    setPreviewTheme: (theme: AppTheme | null) => {
      set({ previewTheme: theme });
    },

    loadTheme: (theme: AppTheme) => {
      const themes = new Map(get().availableThemes);
      themes.set(theme.id, theme);
      set({ availableThemes: themes });

      // If this is the active theme, update it
      if (get().activeThemeId === theme.id) {
        set({ activeTheme: theme });
      }
    },

    getEffectiveTheme: () => {
      const { previewTheme, activeTheme } = get();
      return previewTheme || activeTheme;
    },
  }))
);
