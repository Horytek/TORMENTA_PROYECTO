import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!show) return null;
  return (
    <button
      type="button"
      className="store-icon-btn fixed left-4 bottom-24 z-40 size-11 border store-hairline bg-[var(--vitrina-elevated)] flex items-center justify-center lg:hidden store-fab !left-4 !right-auto !bottom-24"
      style={{ bottom: "max(6rem, env(safe-area-inset-bottom))" }}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Volver arriba"
    >
      <ArrowUp className="size-4" />
    </button>
  );
}
