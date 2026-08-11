import { MessageCircle, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

type Props = {
  itemCount: number;
  total: number;
  enlaceWhatsApp: string | null;
  onOpenCart: () => void;
};

export function CheckoutBar({ itemCount, total, enlaceWhatsApp, onOpenCart }: Props) {
  const reduce = useReducedMotion();

  return (
    <AnimatePresence>
      {itemCount > 0 && (
        <motion.div
          initial={reduce ? false : { y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduce ? undefined : { y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[min(100%-1.5rem,28rem)] pb-[env(safe-area-inset-bottom)]"
        >
          <div className="flex items-center gap-2 rounded-full border cx-hairline bg-[var(--cx-elevated)] shadow-xl p-1.5 pl-4">
            <button
              type="button"
              onClick={onOpenCart}
              className="cx-focus flex-1 flex items-center gap-2.5 min-w-0 text-left"
            >
              <ShoppingCart className="size-4 text-[var(--cx-accent)] shrink-0" />
              <span className="text-sm font-semibold truncate">
                {itemCount} · S/ {total.toFixed(2)}
              </span>
            </button>
            {enlaceWhatsApp ? (
              <a
                href={enlaceWhatsApp}
                target="_blank"
                rel="noopener noreferrer"
                className="cx-btn-wa cx-focus shrink-0 h-11 px-4 inline-flex items-center gap-1.5 text-xs sm:text-sm"
              >
                <MessageCircle className="size-4" />
                <span className="hidden xs:inline sm:inline">Pedir</span>
                WhatsApp
              </a>
            ) : (
              <button
                type="button"
                onClick={onOpenCart}
                className="cx-focus shrink-0 h-11 px-4 rounded-full text-xs font-semibold text-white"
                style={{ background: "var(--cx-accent)" }}
              >
                Ver pedido
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
