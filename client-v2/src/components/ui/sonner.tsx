import { useEffect, useState } from "react";
import { Toaster as SonnerToaster } from "sonner";

/**
 * Toaster global (sonner). El dark mode de client-v2 es una clase `.dark` en
 * <html> (no next-themes), así que sincronizamos el tema de sonner observando
 * esa clase — un solo MutationObserver, sin estado global de tema.
 */
export function Toaster() {
  const [theme, setTheme] = useState<"light" | "dark">(
    typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : "light"
  );

  useEffect(() => {
    const el = document.documentElement;
    const sync = () => setTheme(el.classList.contains("dark") ? "dark" : "light");
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <SonnerToaster
      theme={theme}
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: "rounded-xl border border-border shadow-lg",
        },
      }}
    />
  );
}
