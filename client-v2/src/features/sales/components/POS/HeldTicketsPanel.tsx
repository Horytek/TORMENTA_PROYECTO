import { Clock3, X, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useCartStore } from "@/store/useCartStore";

/**
 * Tickets en espera — "aparcar" el carrito actual para atender a otro
 * cliente sin perder lo que ya se armó, y retomarlo después. Gap real que
 * tenía el POS: no había forma de atender dos clientes en paralelo con un
 * solo mostrador (caso típico de tienda de ropa con varios probándose a la
 * vez). Persistido en localStorage — sobrevive a un refresh accidental.
 */
export function HeldTicketsPanel() {
  const heldTickets = useCartStore((s) => s.heldTickets);
  const items = useCartStore((s) => s.items);
  const holdCurrentCart = useCartStore((s) => s.holdCurrentCart);
  const resumeTicket = useCartStore((s) => s.resumeTicket);
  const discardTicket = useCartStore((s) => s.discardTicket);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 text-xs"
        disabled={items.length === 0}
        onClick={holdCurrentCart}
        title="Guardar este carrito y atender a otro cliente"
      >
        <Clock3 className="h-3.5 w-3.5" /> Aparcar venta
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="relative gap-1.5 text-xs">
            <ShoppingBag className="h-3.5 w-3.5" /> En espera
            {heldTickets.length > 0 && (
              <Badge variant="warning" className="h-4 min-w-4 justify-center rounded-full px-1 text-[10px]">
                {heldTickets.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <div className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Tickets en espera
          </div>
          <DropdownMenuSeparator />
          {heldTickets.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-muted-foreground">
              No hay ventas aparcadas.
            </p>
          ) : (
            <div className="flex max-h-64 flex-col gap-1 overflow-y-auto p-1">
              {heldTickets.map((ticket) => {
                const total = ticket.items.reduce((sum, i) => sum + i.precio_total, 0);
                return (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 hover:bg-muted/60"
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left cursor-pointer"
                      onClick={() => resumeTicket(ticket.id)}
                    >
                      <p className="truncate text-xs font-medium text-foreground">{ticket.label}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {ticket.items.length} {ticket.items.length === 1 ? "ítem" : "ítems"} · S/ {total.toFixed(2)}
                      </p>
                    </button>
                    <button
                      type="button"
                      className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => discardTicket(ticket.id)}
                      title="Descartar ticket"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
