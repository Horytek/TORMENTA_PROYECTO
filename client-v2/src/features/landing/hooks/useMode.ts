import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import type { Mode } from "../data/landing.data";

const STORAGE_KEY = "horytek-landing-mode";

function readStored(): Mode | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored === "pocket" || stored === "standard" || stored === "ecommerce") return stored;
  } catch {
    // sessionStorage puede no estar disponible — ignorar.
  }
  return null;
}

function parseMode(raw: string | null): Mode | null {
  if (raw === "pocket" || raw === "standard" || raw === "ecommerce") return raw;
  return null;
}

/**
 * Estado de modo de la landing: "standard" | "pocket" | "ecommerce".
 */
export function useMode(): {
  mode: Mode;
  setMode: (next: Mode) => void;
  toggle: () => void;
} {
  const [search, setSearch] = useSearchParams();

  const fromUrl = parseMode(search.get("mode"));
  const mode: Mode = fromUrl ?? (readStored() ?? "standard");

  const setMode = useCallback(
    (next: Mode) => {
      try {
        sessionStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignorar
      }

      const updated = new URLSearchParams(search);
      if (next === "standard") {
        updated.delete("mode");
      } else {
        updated.set("mode", next);
      }
      setSearch(updated, { replace: true });
    },
    [search, setSearch],
  );

  const toggle = useCallback(() => {
    const order: Mode[] = ["standard", "pocket", "ecommerce"];
    const i = order.indexOf(mode);
    setMode(order[(i + 1) % order.length]);
  }, [mode, setMode]);

  return { mode, setMode, toggle };
}
