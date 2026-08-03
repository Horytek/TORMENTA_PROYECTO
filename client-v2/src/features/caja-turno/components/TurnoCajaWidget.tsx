import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wallet, Lock, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { getTurnoActivo, abrirTurno, cerrarTurno } from "../api/cajaTurno";
import type { CierreTurnoResultado } from "../types";

// ─────────────────────────────────────────────────────────────────
// TurnoCajaWidget — Apertura/cierre de turno con arqueo ciego.
// El cajero declara lo contado ANTES de ver lo que el sistema espera.
// ─────────────────────────────────────────────────────────────────

const METODOS = ["EFECTIVO", "TARJETA", "TRANSFERENCIA", "YAPE", "PLIN"] as const;

interface TurnoCajaWidgetProps {
  idSucursal: number | null | undefined;
}

export function TurnoCajaWidget({ idSucursal }: TurnoCajaWidgetProps) {
  const queryClient = useQueryClient();
  const [abrirOpen, setAbrirOpen] = useState(false);
  const [cerrarOpen, setCerrarOpen] = useState(false);
  const [montoInicial, setMontoInicial] = useState("");
  const [conteo, setConteo] = useState<{ metodo: string; monto: string }[]>([{ metodo: "EFECTIVO", monto: "" }]);
  const [observaciones, setObservaciones] = useState("");
  const [resultado, setResultado] = useState<CierreTurnoResultado | null>(null);

  const { data: turno } = useQuery({
    queryKey: ["turno-activo", idSucursal],
    queryFn: () => getTurnoActivo(idSucursal as number),
    enabled: !!idSucursal,
    refetchInterval: 60000,
  });

  const mAbrir = useMutation({
    mutationFn: () => abrirTurno(idSucursal as number, Number(montoInicial) || 0),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["turno-activo", idSucursal] });
      setAbrirOpen(false);
      setMontoInicial("");
    },
  });

  const mCerrar = useMutation({
    mutationFn: () => {
      const declarado = Object.fromEntries(
        conteo.filter((c) => c.metodo && Number(c.monto) > 0).map((c) => [c.metodo, Number(c.monto)])
      );
      return cerrarTurno(turno!.id_turno, declarado, observaciones || undefined);
    },
    onSuccess: (data) => {
      setResultado(data);
      queryClient.invalidateQueries({ queryKey: ["turno-activo", idSucursal] });
    },
  });

  const cerrarDialogYLimpiar = () => {
    setCerrarOpen(false);
    setConteo([{ metodo: "EFECTIVO", monto: "" }]);
    setObservaciones("");
    setResultado(null);
  };

  if (!idSucursal) return null;

  return (
    <>
      {turno ? (
        <button
          onClick={() => setCerrarOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 h-8 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors cursor-pointer"
        >
          <Wallet className="h-3.5 w-3.5" /> Turno #{turno.id_turno} abierto
        </button>
      ) : (
        <button
          onClick={() => setAbrirOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-dashed border-muted-foreground/40 px-2.5 h-8 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors cursor-pointer"
        >
          <Wallet className="h-3.5 w-3.5" /> Abrir turno
        </button>
      )}

      {/* Abrir turno */}
      <Dialog open={abrirOpen} onOpenChange={setAbrirOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Abrir turno de caja</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="monto-inicial">Monto inicial (fondo de caja)</Label>
            <Input
              id="monto-inicial"
              type="number"
              min={0}
              step="0.10"
              value={montoInicial}
              onChange={(e) => setMontoInicial(e.target.value)}
              placeholder="0.00"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAbrirOpen(false)}>Cancelar</Button>
            <Button onClick={() => mAbrir.mutate()} disabled={mAbrir.isPending}>
              {mAbrir.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />} Abrir turno
            </Button>
          </DialogFooter>
          {mAbrir.isError && (
            <p className="text-xs text-destructive">
              {(mAbrir.error as { response?: { data?: { message?: string } } })?.response?.data?.message
                ?? "No se pudo abrir el turno."}
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Cerrar turno (arqueo ciego) */}
      <Dialog open={cerrarOpen} onOpenChange={(o) => !o && cerrarDialogYLimpiar()}>
        <DialogContent className="max-w-md">
          {!resultado ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-1.5">
                  <Lock className="h-4 w-4" /> Cierre de turno — conteo ciego
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Cuenta el efectivo y comprobantes SIN mirar el sistema. El sistema recién calcula lo esperado después de que confirmes.
                </p>
              </DialogHeader>

              <div className="space-y-2">
                {conteo.map((fila, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Select value={fila.metodo} onValueChange={(v) => setConteo((prev) => prev.map((f, idx) => idx === i ? { ...f, metodo: v } : f))}>
                      <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {METODOS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number" min={0} step="0.10" placeholder="0.00"
                      value={fila.monto}
                      onChange={(e) => setConteo((prev) => prev.map((f, idx) => idx === i ? { ...f, monto: e.target.value } : f))}
                      className="h-8 text-xs"
                    />
                    <Button
                      type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0"
                      onClick={() => setConteo((prev) => prev.filter((_, idx) => idx !== i))}
                      disabled={conteo.length === 1}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button" variant="outline" size="sm" className="gap-1.5 h-7 text-xs"
                  onClick={() => setConteo((prev) => [...prev, { metodo: "EFECTIVO", monto: "" }])}
                >
                  <Plus className="h-3.5 w-3.5" /> Agregar método
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="obs-turno">Observaciones (opcional)</Label>
                <Input id="obs-turno" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Ej. faltó cambio, billete falso…" />
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={cerrarDialogYLimpiar}>Cancelar</Button>
                <Button onClick={() => mCerrar.mutate()} disabled={mCerrar.isPending}>
                  {mCerrar.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />} Confirmar y ver resultado
                </Button>
              </DialogFooter>
              {mCerrar.isError && <p className="text-xs text-destructive">No se pudo cerrar el turno.</p>}
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Resultado del arqueo</DialogTitle>
              </DialogHeader>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="py-1.5">Método</th>
                    <th className="py-1.5 text-right">Declarado</th>
                    <th className="py-1.5 text-right">Esperado</th>
                    <th className="py-1.5 text-right">Diferencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {Object.keys(resultado.diferencia).map((metodo) => {
                    const diff = resultado.diferencia[metodo] || 0;
                    return (
                      <tr key={metodo}>
                        <td className="py-1.5 font-medium">{metodo}</td>
                        <td className="py-1.5 text-right">S/ {(resultado.declarado[metodo] || 0).toFixed(2)}</td>
                        <td className="py-1.5 text-right">S/ {(resultado.esperado[metodo] || 0).toFixed(2)}</td>
                        <td className={`py-1.5 text-right font-semibold ${diff === 0 ? "text-muted-foreground" : diff > 0 ? "text-blue-600" : "text-destructive"}`}>
                          {diff > 0 ? "+" : ""}{diff.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <DialogFooter>
                <Button onClick={cerrarDialogYLimpiar}>Listo</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
