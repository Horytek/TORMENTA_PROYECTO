import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormDialog } from "@/components/shared/FormDialog";
import { FormField } from "@/components/shared/FormField";
import { getCuentasContables, getCentrosCosto, createAsiento } from "../api/accounting";
import type { LineaAsiento, TipoAsiento } from "../types";

interface JournalEntryFormProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LineaForm extends LineaAsiento {
  key: string;
}

const emptyLinea = (): LineaForm => ({ key: crypto.randomUUID(), id_cuenta: 0, id_centro_costo: null, descripcion: "", debe: 0, haber: 0 });

const TIPOS: { value: TipoAsiento; label: string }[] = [
  { value: "manual", label: "Manual" },
  { value: "apertura", label: "Apertura" },
  { value: "ajuste", label: "Ajuste" },
  { value: "cierre", label: "Cierre" },
];

const todayIso = () => new Date().toISOString().slice(0, 10);

export function JournalEntryForm({ isOpen, onClose }: JournalEntryFormProps) {
  const queryClient = useQueryClient();

  const { data: cuentas = [] } = useQuery({ queryKey: ["cuentas-contables"], queryFn: getCuentasContables, enabled: isOpen });
  const { data: centros = [] } = useQuery({ queryKey: ["centros-costo"], queryFn: getCentrosCosto, enabled: isOpen });
  const cuentasMovibles = useMemo(() => cuentas.filter((c) => c.permite_movimiento === 1 && c.estado === 1), [cuentas]);

  const [fecha, setFecha] = useState(todayIso());
  const [tipo, setTipo] = useState<TipoAsiento>("manual");
  const [descripcion, setDescripcion] = useState("");
  const [documentoOrigen, setDocumentoOrigen] = useState("");
  const [lineas, setLineas] = useState<LineaForm[]>([emptyLinea(), emptyLinea()]);
  const [error, setError] = useState<string | null>(null);

  const totalDebe = lineas.reduce((sum, l) => sum + (Number(l.debe) || 0), 0);
  const totalHaber = lineas.reduce((sum, l) => sum + (Number(l.haber) || 0), 0);
  const diferencia = Math.round((totalDebe - totalHaber) * 100) / 100;
  const balanceado = diferencia === 0 && totalDebe > 0;
  const lineasValidas = lineas.every((l) => l.id_cuenta > 0 && ((l.debe > 0) !== (l.haber > 0)));

  const resetForm = () => {
    setFecha(todayIso());
    setTipo("manual");
    setDescripcion("");
    setDocumentoOrigen("");
    setLineas([emptyLinea(), emptyLinea()]);
    setError(null);
  };

  const mutation = useMutation({
    mutationFn: () =>
      createAsiento({
        fecha, tipo, descripcion, documento_origen: documentoOrigen || undefined,
        lineas: lineas.map(({ key, ...l }) => l),
      }),
    onSuccess: (ok) => {
      if (!ok) { setError("El periodo podría estar cerrado o alguna cuenta no admite movimientos."); return; }
      queryClient.invalidateQueries({ queryKey: ["asientos"] });
      queryClient.invalidateQueries({ queryKey: ["libro-diario"] });
      queryClient.invalidateQueries({ queryKey: ["libro-mayor"] });
      resetForm();
      onClose();
    },
    onError: () => setError("No se pudo contabilizar el asiento."),
  });

  const updateLinea = (key: string, patch: Partial<LineaForm>) => {
    setLineas((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcion.trim()) { setError("La descripción es obligatoria."); return; }
    if (!lineasValidas) { setError("Cada línea necesita una cuenta y un monto en Debe o en Haber (no ambos)."); return; }
    if (!balanceado) { setError("El asiento no está balanceado: Debe y Haber deben ser iguales."); return; }
    setError(null);
    mutation.mutate();
  };

  return (
    <FormDialog
      open={isOpen}
      onClose={() => { resetForm(); onClose(); }}
      title="Nuevo asiento contable"
      description="Cada línea debe tener un monto en Debe o en Haber. El asiento solo se contabiliza si está balanceado."
      submitLabel="Contabilizar asiento"
      isSubmitting={mutation.isPending}
      error={error}
      className="max-w-3xl"
      onSubmit={handleSubmit}
    >
      <div className="grid grid-cols-3 gap-3">
        <FormField label="Fecha" htmlFor="asiento-fecha">
          <Input id="asiento-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </FormField>
        <FormField label="Tipo">
          <Select value={tipo} onValueChange={(v) => setTipo(v as TipoAsiento)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TIPOS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Documento de origen (opcional)" htmlFor="asiento-doc">
          <Input id="asiento-doc" placeholder="Ej: Factura F001-123" value={documentoOrigen} onChange={(e) => setDocumentoOrigen(e.target.value)} />
        </FormField>
      </div>

      <FormField label="Descripción" htmlFor="asiento-desc">
        <Input id="asiento-desc" placeholder="Ej: Registro de venta al contado" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
      </FormField>

      <div className="space-y-2">
        <div className="grid grid-cols-[1fr_140px_110px_110px_32px] gap-2 px-1 text-xs font-medium text-muted-foreground">
          <span>Cuenta</span>
          <span>Centro de costo</span>
          <span>Debe</span>
          <span>Haber</span>
          <span />
        </div>

        {lineas.map((linea) => (
          <div key={linea.key} className="grid grid-cols-[1fr_140px_110px_110px_32px] items-center gap-2">
            <Select value={linea.id_cuenta ? String(linea.id_cuenta) : ""} onValueChange={(v) => updateLinea(linea.key, { id_cuenta: Number(v) })}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Cuenta..." /></SelectTrigger>
              <SelectContent>
                {cuentasMovibles.map((c) => (
                  <SelectItem key={c.id_cuenta} value={String(c.id_cuenta)}>{c.codigo} — {c.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={linea.id_centro_costo ? String(linea.id_centro_costo) : "none"}
              onValueChange={(v) => updateLinea(linea.key, { id_centro_costo: v === "none" ? null : Number(v) })}
            >
              <SelectTrigger className="h-9"><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {centros.map((c) => <SelectItem key={c.id_centro_costo} value={String(c.id_centro_costo)}>{c.nombre}</SelectItem>)}
              </SelectContent>
            </Select>

            <Input
              type="number" step="0.01" min="0" className="h-9" placeholder="0.00"
              value={linea.debe || ""}
              onChange={(e) => updateLinea(linea.key, { debe: Number(e.target.value) || 0, haber: 0 })}
            />
            <Input
              type="number" step="0.01" min="0" className="h-9" placeholder="0.00"
              value={linea.haber || ""}
              onChange={(e) => updateLinea(linea.key, { haber: Number(e.target.value) || 0, debe: 0 })}
            />

            <Button
              type="button" variant="ghost" size="icon" className="h-9 w-8 text-destructive"
              disabled={lineas.length <= 2}
              onClick={() => setLineas((prev) => prev.filter((l) => l.key !== linea.key))}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}

        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setLineas((prev) => [...prev, emptyLinea()])}>
          <Plus className="h-3.5 w-3.5" /> Agregar línea
        </Button>
      </div>

      <div className={`flex items-center justify-between rounded-lg border px-4 py-2.5 ${balanceado ? "border-emerald-500/30 bg-emerald-500/10" : "border-amber-500/30 bg-amber-500/10"}`}>
        <div className="flex items-center gap-2 text-sm font-medium">
          {balanceado ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-amber-600" />}
          {balanceado ? "Asiento balanceado" : `Diferencia: S/ ${Math.abs(diferencia).toFixed(2)}`}
        </div>
        <div className="num text-sm text-muted-foreground">
          Debe S/ {totalDebe.toFixed(2)} · Haber S/ {totalHaber.toFixed(2)}
        </div>
      </div>
    </FormDialog>
  );
}
