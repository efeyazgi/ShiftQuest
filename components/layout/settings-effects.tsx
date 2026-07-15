"use client";

import { useEffect } from "react";
import { useGameStore } from "@/features/game/store";

/** Applies persisted visual preferences beyond the settings route itself. */
export function SettingsEffects() {
  const theme = useGameStore((state) => state.settings.theme);
  const accessibility = useGameStore((state) => state.settings.accessibility);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const applyTheme = () => {
      const resolved = theme === "system" ? (media.matches ? "light" : "dark") : theme;
      document.documentElement.dataset.theme = theme;
      document.documentElement.dataset.resolvedTheme = resolved;
      document.documentElement.style.colorScheme = resolved;
    };
    applyTheme();
    media.addEventListener("change", applyTheme);
    return () => media.removeEventListener("change", applyTheme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.animations = accessibility.animations ? "on" : "off";
    document.documentElement.dataset.reducedMotion = accessibility.reducedMotion ? "on" : "off";
    document.documentElement.dataset.highContrast = accessibility.highContrast ? "on" : "off";
  }, [accessibility]);

  return null;
}
