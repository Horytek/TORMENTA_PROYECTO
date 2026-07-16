import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import type { Mode } from "../data/landing.data";

const STORAGE_KEY = "horytek-landing-mode";

function readStored(): Mode | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored === "pocket" || stored === "standard") return stored;
  } catch {
    // sessionStorage puede no estar disponible — ignorar.
  }
  return null;
}

/**
 * Estado de modo de la landing: "standard" | "pocket".
 *
 * El modo se DERIVA de la URL en cada render (sin `useState`) para evitar
 * cascadas de render y mantener una sola fuente de verdad. La URL es lo
 * persistente y compartible; sessionStorage solo aporta una pista inicial
 * para que el modo sobreviva a navegaciones a `/login` y de vuelta.
 *
 * `setMode` actualiza URL + storage; `useSearchParams` dispara el re-render
 * y el modo se re-deriva.
 */
export function useMode(): {
  mode: Mode;
  setMode: (next: Mode) => void;
  toggle: () => void;
} {
  const [search, setSearch] = useSearchParams();

  const fromUrl = search.get("mode");
  const mode: Mode =
    fromUrl === "pocket" || fromUrl === "standard" ? fromUrl : (readStored() ?? "standard");

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
    setMode(mode === "standard" ? "pocket" : "standard");
  }, [mode, setMode]);

  return { mode, setMode, toggle };
}