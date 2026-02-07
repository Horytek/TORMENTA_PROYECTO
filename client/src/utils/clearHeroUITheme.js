/**
 * Limpia el tema persistido por HeroUI en localStorage.
 *
 * "Sin que el usuario se de cuenta": por defecto se difiere hasta después del
 * próximo paint para evitar flashes mientras React desmonta/monta layouts.
 */
function scheduleAfterPaint(fn, afterPaint) {
  if (typeof window === "undefined") return;

  if (!afterPaint) {
    setTimeout(fn, 0);
    return;
  }

  const raf = window.requestAnimationFrame?.bind(window);
  if (!raf) {
    setTimeout(fn, 0);
    return;
  }

  raf(() => raf(fn));
}

export function clearHeroUIThemeStorage(options = {}) {
  const { afterPaint = true } = options;

  const remove = () => {
    try {
      window.localStorage.removeItem("heroui-theme");
    } catch {
      // noop
    }
  };

  scheduleAfterPaint(remove, afterPaint);
}

/**
 * Fuerza el modo claro para HeroUI al cerrar sesión.
 * - Persiste `heroui-theme=light`
 * - Quita la clase `dark` del <html> inmediatamente (para que Tailwind responda)
 * - Notifica al árbol React (ThemeClassSync) para que haga `setTheme('light')`
 */
export function forceHeroUILightTheme(options = {}) {
  const { afterPaint = true } = options;

  const apply = () => {
    try {
      window.localStorage.setItem("heroui-theme", "light");
    } catch {
      // noop
    }

    try {
      window.document?.documentElement?.classList?.remove("dark");
    } catch {
      // noop
    }

    try {
      window.dispatchEvent(
        new CustomEvent("hc:set-heroui-theme", { detail: "light" })
      );
    } catch {
      // noop
    }
  };

  scheduleAfterPaint(apply, afterPaint);
}
