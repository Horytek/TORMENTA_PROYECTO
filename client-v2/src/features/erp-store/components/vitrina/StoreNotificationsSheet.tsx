import { Bell } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type Props = {
  slug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enabled: boolean;
};

/**
 * Tienda web ERP no tiene inbox de solicitudes/notificaciones in-app
 * (compra directa). Mantiene el sheet vacío para no romper el header.
 */
export function StoreNotificationsSheet({ open, onOpenChange }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="vitrina w-full max-w-none sm:max-w-md p-0 flex flex-col gap-0 bg-[var(--vitrina-elevated)]"
      >
        <SheetHeader className="px-4 pt-5 pb-3 border-b store-hairline text-left space-y-1">
          <SheetTitle className="text-base flex items-center gap-2">
            <Bell className="size-4" /> Notificaciones
          </SheetTitle>
          <SheetDescription className="text-xs store-muted">
            Avisos de tu tienda y pedidos.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <div className="rounded-xl border store-hairline border-dashed p-8 text-center text-sm store-muted">
            Aún no tienes notificaciones.
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
