import { useEffect, useState } from "react";

/**
 * True cuando el usuario está viendo el pie: llegó al final del documento
 * o el footer ya cruza la mitad superior del viewport (debajo del header sticky).
 */
export function useScrolledToFooter() {
  const [inFooter, setInFooter] = useState(false);

  useEffect(() => {
    const footer = document.getElementById("pie") ?? document.querySelector("footer");
    if (!footer) return;

    const compute = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight > window.innerHeight + 24;
      const atBottom =
        scrollable && window.innerHeight + window.scrollY >= doc.scrollHeight - 8;
      const top = footer.getBoundingClientRect().top;
      const footerIsPrimary = window.scrollY > 8 && top < window.innerHeight * 0.45;
      setInFooter(atBottom || footerIsPrimary);
    };

    compute();
    window.addEventListener("scroll", compute, { passive: true });
    window.addEventListener("resize", compute);
    return () => {
      window.removeEventListener("scroll", compute);
      window.removeEventListener("resize", compute);
    };
  }, []);

  return inFooter;
}

/**
 * Sección de ancla visible. Se limpia al llegar al footer para que el navbar
 * no se quede marcado en el último bloque de contenido.
 */
export function useActiveSection(sectionIds: readonly string[]) {
  const [active, setActive] = useState<string | null>(null);
  const inFooter = useScrolledToFooter();
  const key = sectionIds.join("|");

  useEffect(() => {
    if (inFooter) {
      setActive(null);
      return;
    }

    const ids = key ? key.split("|") : [];
    const visible = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          if (!id) continue;
          if (entry.isIntersecting) visible.set(id, entry.boundingClientRect.top);
          else visible.delete(id);
        }
        const ordered = ids.filter((id) => visible.has(id));
        setActive(ordered[0] ?? null);
      },
      { rootMargin: "-28% 0px -55% 0px", threshold: 0 },
    );

    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [key, inFooter]);

  return inFooter ? null : active;
}
