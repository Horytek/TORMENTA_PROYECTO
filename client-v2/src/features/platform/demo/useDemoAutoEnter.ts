import { useEffect, useRef, useState } from "react";

type Phase = "skip" | "entering" | "failed";

/**
 * En slug demo, entra solo con credenciales seed (sin mostrar el gate).
 * Si falla (sin seed), phase = "failed" para redirigir al login.
 * Soporta `enabled` que pasa a true más tarde (p. ej. tras cargar una lista).
 */
export function useDemoAutoEnter(enabled: boolean, enter: () => Promise<void>): Phase {
  const [phase, setPhase] = useState<Phase>(enabled ? "entering" : "skip");
  const enterRef = useRef(enter);
  enterRef.current = enter;
  const ran = useRef(false);

  useEffect(() => {
    if (!enabled || ran.current) return;
    ran.current = true;
    setPhase("entering");
    let cancelled = false;
    (async () => {
      try {
        await enterRef.current();
        if (!cancelled) setPhase("skip");
      } catch {
        if (!cancelled) setPhase("failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  // Un frame antes del effect cuando `enabled` acaba de activarse
  if (enabled && phase === "skip" && !ran.current) return "entering";

  return phase;
}
