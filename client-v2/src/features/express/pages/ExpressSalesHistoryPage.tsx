import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Receipt, Printer, FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getExpressSales, getExpressSaleDetails, getExpressMe } from "../api/express";
import { downloadExpressSalePdf, printExpressSaleTicket } from "../lib/printExpressSale";

const soles = (n: number) => `S/ ${n.toFixed(2)}`;

export default function ExpressSalesHistoryPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: sales = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ["express-sales"],
    queryFn: getExpressSales,
  });
  const { data: me } = useQuery({ queryKey: ["express-me"], queryFn: getExpressMe });
  const { data: detail } = useQuery({
    queryKey: ["express-sale-detail", selectedId],
    queryFn: () => getExpressSaleDetails(selectedId as number),
    enabled: selectedId != null,
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">Historial ({sales.length})</h1>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => refetch()}>
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
        </div>
      ) : sales.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <Receipt className="h-8 w-8 opacity-40" />
          <p className="text-sm">Sin ventas registradas.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sales.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedId(s.id)}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-3 text-left transition-colors hover:bg-muted"
            >
              <div>
                <p className="text-sm font-medium text-foreground">Venta #{s.id}</p>
                <p className="text-[11px] text-muted-foreground">{new Date(s.created_at).toLocaleString("es-PE")}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{s.payment_method}</span>
                <span className="font-semibold text-amber-500">{soles(Number(s.total))}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <Dialog open={selectedId != null} onOpenChange={(o) => !o && setSelectedId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Venta #{selectedId}</DialogTitle>
          </DialogHeader>
          {!detail ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg border border-border divide-y divide-border/60">
                {detail.items.map((i, idx) => (
                  <div key={idx} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="text-foreground">{i.quantity} × {i.name}</span>
                    <span className="font-medium text-foreground">{soles(i.price * i.quantity)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between px-3 py-2 text-sm font-bold">
                  <span>Total</span>
                  <span className="text-amber-500">{soles(Number(detail.total))}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-1.5" onClick={() => printExpressSaleTicket(detail, me?.name)}>
                  <Printer className="h-3.5 w-3.5" /> Imprimir
                </Button>
                <Button variant="outline" className="flex-1 gap-1.5" onClick={() => downloadExpressSalePdf(detail, me?.name)}>
                  <FileDown className="h-3.5 w-3.5" /> PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
