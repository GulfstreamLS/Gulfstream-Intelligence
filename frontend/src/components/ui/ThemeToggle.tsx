"use client";

import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "../../store/themeStore";

export function ThemeToggle() {
  const { theme, toggle } = useThemeStore();

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="p-2 rounded-lg text-gs-muted hover:bg-gs-bg dark:hover:bg-white/10 transition-colors"
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
    </button>
  );
}
