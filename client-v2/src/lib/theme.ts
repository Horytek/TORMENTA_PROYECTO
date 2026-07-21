/**
 * Alternancia de tema (claro/oscuro) sin jank.
 *
 * El ERP tiene ~130 elementos con `transition-colors`/`transition-all`. Al
 * togglear la clase `.dark` en <html>, el navegador anima el cambio de color de
 * TODOS a la vez → la transición se siente lenta/entrecortada. La técnica
 * (la misma de next-themes) es desactivar las transiciones durante el instante
 * del cambio y restaurarlas en el tick siguiente: el tema cambia al instante y
 * el resto de animaciones de la UI se conservan.
 */
export type Theme = "light" | "dark";

// Supresor ÚNICO reutilizable + su timer de limpieza. Así toggles rápidos nunca
// acumulan varios <style> (que en un tab en segundo plano, donde setTimeout se
// estrangula, podrían quedar pegados y matar todas las transiciones).
let suppressor: HTMLStyleElement | null = null;
let cleanupTimer: number | undefined;

function suppressTransitions(): void {
  if (!suppressor) {
    suppressor = document.createElement("style");
    suppressor.appendChild(
      document.createTextNode(
        "*,*::before,*::after{transition:none !important;animation:none !important}"
      )
    );
  }
  if (!suppressor.isConnected) document.head.appendChild(suppressor);
  if (cleanupTimer !== undefined) window.clearTimeout(cleanupTimer);
}

function restoreTransitions(): void {
  // Forzar un reflow: el cambio de clase se aplica con el override todavía
  // activo → sin animar. Recién en el siguiente tick se quita.
  window.getComputedStyle(document.body).transition;
  // setTimeout (no requestAnimationFrame): rAF no dispara en pestañas en
  // segundo plano, lo que dejaría el supresor pegado. Con un supresor único,
  // a lo sumo queda UNO y se retira en cuanto el tab vuelve a estar activo.
  cleanupTimer = window.setTimeout(() => {
    suppressor?.remove();
    cleanupTimer = undefined;
  }, 1);
}

export function applyTheme(theme: Theme): void {
  suppressTransitions();
  document.documentElement.classList.toggle("dark", theme === "dark");
  restoreTransitions();
}
