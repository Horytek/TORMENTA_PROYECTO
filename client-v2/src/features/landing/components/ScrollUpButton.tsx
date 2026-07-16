import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const SCROLL_THRESHOLD = 300;

/**
 * Botón flotante para volver al top.
 * Solo aparece después de SCROLL_THRESHOLD px para no estorbar en el hero.
 * Respeta prefers-reduced-motion vía `scroll-behavior` global.
 */
export function ScrollUpButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const toggle = () => {
      setVisible(window.scrollY > SCROLL_THRESHOLD);
    };

    toggle(); // estado inicial por si la página carga ya scrolleada
    window.addEventListener("scroll", toggle, { passive: true });
    return () => window.removeEventListener("scroll", toggle);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Volver arriba"
      className={cn(
        "fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-[0_2px_8px_-2px_hsl(var(--foreground)/0.18)] transition-all",
        "hover:border-brand hover:text-brand",
      )}
    >
      <ChevronUp className="h-5 w-5" aria-hidden />
    </button>
  );
}