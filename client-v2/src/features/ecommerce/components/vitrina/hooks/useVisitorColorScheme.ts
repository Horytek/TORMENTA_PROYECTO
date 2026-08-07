import { useCallback, useEffect, useState } from "react";
import {
  SCHEME_STORAGE_PREFIX,
  resolveScheme,
  type ColorSchemePref,
  type ResolvedScheme,
  type StoreTheme,
} from "../../../types/theme";

export function useVisitorColorScheme(slug: string, theme: StoreTheme) {
  const [pref, setPrefState] = useState<ColorSchemePref>(() => {
    if (typeof window === "undefined") return theme.color_scheme_default;
    try {
      const stored = localStorage.getItem(`${SCHEME_STORAGE_PREFIX}${slug}`) as ColorSchemePref | null;
      if (stored === "system" || stored === "light" || stored === "dark") return stored;
    } catch {
      /* noop */
    }
    return theme.color_scheme_default || "system";
  });

  const [systemDark, setSystemDark] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)").matches : true
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemDark(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`${SCHEME_STORAGE_PREFIX}${slug}`) as ColorSchemePref | null;
      if (stored === "system" || stored === "light" || stored === "dark") {
        setPrefState(stored);
      } else {
        setPrefState(theme.color_scheme_default || "system");
      }
    } catch {
      setPrefState(theme.color_scheme_default || "system");
    }
  }, [slug, theme.color_scheme_default]);

  const setPref = useCallback(
    (next: ColorSchemePref) => {
      setPrefState(next);
      try {
        localStorage.setItem(`${SCHEME_STORAGE_PREFIX}${slug}`, next);
      } catch {
        /* noop */
      }
    },
    [slug]
  );

  const cycle = useCallback(() => {
    const order: ColorSchemePref[] = ["system", "light", "dark"];
    const i = order.indexOf(pref);
    setPref(order[(i + 1) % order.length]);
  }, [pref, setPref]);

  const resolved: ResolvedScheme = resolveScheme(pref, systemDark);

  return {
    pref,
    setPref,
    cycle,
    resolved,
    allowToggle: theme.allow_visitor_scheme_toggle !== false,
  };
}
