import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2, PackageSearch } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { FormField } from "@/components/shared/FormField";
import { useUserStore } from "@/store/useUserStore";

import { ProductPickerPanel } from "./ProductPickerPanel";
import {
  getAlmacenesIngreso,
  getAlmacenesSalida,
  getDestinatariosIngreso,
  getDestinatariosSalida,
  getDocumentosIngreso,
  getDocumentosSalida,
  insertNotaIngreso,
  insertNotaSalida,
} from "../api/warehouseNotes";
import type { NoteKind, NoteFormItem, NotaInsertPayload } from "../types";

const GLOSAS: Record<NoteKind, string[]> = {
  ingreso: [
    "COMPRA EN EL PAIS", "COMPRA EN EL EXTERIOR", "TRANSFERENCIA ENTRE ALMACENES",
    "DEVOLUCION", "AJUSTE INVENTARIO", "OTROS INGRESOS",
  ],
  salida: [
    "VENTA DE PRODUCTOS", "CONSIGNACION CLIENTE", "TRASLADO ENTRE ALMACENES",
    "MATERIA PRIMA PRODUCCION", "DEVOLUCION PROVEEDOR", "AJUSTE INVENTARIO", "OTRAS SALIDAS",
  ],
};

interface HeaderValues {
  almacenOrigen: string;
  almacenDestino: string;
  destinatario: string;
  glosa: string;
  nota: string;
  fecha: string;
  observacion: string;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

const emptyHeader: HeaderValues = {
  almacenOrigen: "",
  almacenDestino: "",
  destinatario: "",
  glosa: "",
  nota: "",
  fecha: todayISO(),
  observacion: "",
};

const buildFechaCompleta = (fecha: string) => {
  const now = new Date();
  const [y, m, d] = fecha.split("-").map(Number);
  const local = new Date(y, (m ?? 1) - 1, d ?? 1, now.getHours(), now.getMinutes(), now.getSeconds());
  const tz = local.getTimezoneOffset() * 60000;
  return new Date(local.getTime() - tz).toISOString().slice(0, 19).replace("T", " ");
};

interface NoteFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTipo?: NoteKind;
}

export default function NoteFormDialog({ isOpen, onClose, defaultTipo = "ingreso" }: NoteFormDialogProps) {
  const queryClient = useQueryClient();
  const user = useUserStore((s) => s.user);
  const isAdmin = user?.roleId === 10;

  const [tipoNota, setTipoNota] = useState<NoteKind>(defaultTipo);
  const [items, setItems] = useState<NoteFormItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTipoNota(defaultTipo);
      setItems([]);
      setError(null);
    }
  }, [isOpen, defaultTipo]);

  const { control, register, handleSubmit, watch, reset } = useForm<HeaderValues>({ defaultValues: emptyHeader });
  const almacenOrigen = watch("almacenOrigen");

  useEffect(() => {
    reset(emptyHeader);
    setItems([]);
  }, [tipoNota, reset]);

  // El origen determina de dónde se lee el stock: si cambia, el carrito ya no es válido.
  useEffect(() => {
    setItems([]);
  }, [almacenOrigen]);

  const { data: almacenes = [] } = useQuery({
    queryKey: ["nota-almacen-almacenes", tipoNota],
    queryFn: () => (tipoNota === "salida" ? getAlmacenesSalida() : getAlmacenesIngreso()),
    enabled: isOpen,
  });

  const { data: destinatarios = [] } = useQuery({
    queryKey: ["nota-almacen-destinatarios", tipoNota],
    queryFn: () => (tipoNota === "salida" ? getDestinatariosSalida() : getDestinatariosIngreso()),
    enabled: isOpen,
  });

  const { data: documentos = [] } = useQuery({
    queryKey: ["nota-almacen-documentos", tipoNota],
    queryFn: () => (tipoNota === "salida" ? getDocumentosSalida() : getDocumentosIngreso()),
    enabled: isOpen,
  });

  const numeroDocumento = documentos[0]?.nuevo_numero_de_nota ?? "";

  const almacenesFiltrados = useMemo(() => {
    if (isAdmin || !user?.sucursal) return almacenes;
    return almacenes.filter((a) => a.sucursal === user.sucursal);
  }, [almacenes, isAdmin, user?.sucursal]);

  const addItem = (item: NoteFormItem) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.uniqueKey === item.uniqueKey);
      if (existing) {
        return prev.map((p) => (p.uniqueKey === item.uniqueKey ? { ...p, cantidad: p.cantidad + item.cantidad } : p));
      }
      return [...prev, item];
    });
  };

  const removeItem = (uniqueKey: string) => setItems((prev) => prev.filter((p) => p.uniqueKey !== uniqueKey));

  const mutation = useMutation({
    mutationFn: (values: HeaderValues) => {
      const payload: NotaInsertPayload = {
        almacenO: tipoNota === "salida" ? values.almacenOrigen : values.almacenOrigen || null,
        almacenD: tipoNota === "ingreso" ? values.almacenDestino : values.almacenDestino || null,
        destinatario: values.destinatario,
        glosa: values.glosa,
        nota: values.nota,
        fecha: buildFechaCompleta(values.fecha),
        observacion: values.observacion,
        producto: items.map((i) => i.codigo),
        cantidad: items.map((i) => i.cantidad),
        tonalidad: items.map((i) => i.id_tonalidad),
        talla: items.map((i) => i.id_talla),
        sku: items.map((i) => i.id_sku),
        numComprobante: numeroDocumento,
        ...(tipoNota === "salida" ? { nom_usuario: user?.username } : { usuario: user?.username }),
      };
      return tipoNota === "salida" ? insertNotaSalida(payload) : insertNotaIngreso(payload);
    },
    onSuccess: (result) => {
      if (!result.success) {
        setError(result.message || "El servidor rechazó el registro. Verifica los datos e intenta de nuevo.");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["notas-ingreso"] });
      queryClient.invalidateQueries({ queryKey: ["notas-salida"] });
      onClose();
    },
    onError: () => setError("No se pudo registrar la nota. Intenta de nuevo."),
  });

  const isValid =
    !!user?.username &&
    !!numeroDocumento &&
    (tipoNota === "ingreso" ? !!watch("almacenDestino") : !!watch("almacenOrigen")) &&
    !!watch("destinatario") &&
    !!watch("glosa") &&
    !!watch("nota") &&
    items.length > 0;

  const onSubmit = (values: HeaderValues) => {
    setError(null);
    mutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva nota de almacén</DialogTitle>
          <DialogDescription>Registra un movimiento de ingreso o salida de inventario.</DialogDescription>
        </DialogHeader>

        <div className="flex gap-1.5 rounded-lg bg-muted p-1">
          {(["ingreso", "salida"] as NoteKind[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setTipoNota(k)}
              className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                tipoNota === k ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              {k === "ingreso" ? "Ingreso" : "Salida"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="N° de documento">
              <Input value={numeroDocumento} disabled placeholder="Cargando…" />
            </FormField>

            <FormField label="Fecha" htmlFor="fecha">
              <Input id="fecha" type="date" {...register("fecha", { required: true })} />
            </FormField>

            <FormField label="Almacén origen" optional={tipoNota === "ingreso"} hint={tipoNota === "ingreso" ? "Solo si es traslado entre almacenes" : undefined}>
              <Controller
                control={control}
                name="almacenOrigen"
                rules={{ required: tipoNota === "salida" }}
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Selecciona almacén de origen" /></SelectTrigger>
                    <SelectContent>
                      {almacenesFiltrados.map((a) => (
                        <SelectItem key={a.id} value={String(a.id)}>{a.almacen}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField label="Almacén destino" optional={tipoNota === "salida"} hint={tipoNota === "salida" ? "Solo si es traslado entre almacenes" : undefined}>
              <Controller
                control={control}
                name="almacenDestino"
                rules={{ required: tipoNota === "ingreso" }}
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Selecciona almacén de destino" /></SelectTrigger>
                    <SelectContent>
                      {almacenesFiltrados.map((a) => (
                        <SelectItem key={a.id} value={String(a.id)}>{a.almacen}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField label={tipoNota === "ingreso" ? "Proveedor" : "Destinatario"}>
              <Controller
                control={control}
                name="destinatario"
                rules={{ required: true }}
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Selecciona uno" /></SelectTrigger>
                    <SelectContent>
                      {destinatarios.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>{d.destinatario}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField label="Concepto (glosa)">
              <Controller
                control={control}
                name="glosa"
                rules={{ required: true }}
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Selecciona un motivo" /></SelectTrigger>
                    <SelectContent>
                      {GLOSAS[tipoNota].map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField label="Referencia / nota" htmlFor="nota">
              <Input id="nota" placeholder="Ej. Ingreso por compra…" {...register("nota", { required: true })} />
            </FormField>
          </div>

          <FormField label="Observaciones" htmlFor="observacion" optional>
            <Textarea id="observacion" rows={2} {...register("observacion")} />
          </FormField>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <PackageSearch className="h-4 w-4" /> Productos
            </div>
            <ProductPickerPanel
              tipo={tipoNota}
              almacen={almacenOrigen}
              items={items}
              onAdd={addItem}
              disabled={tipoNota === "salida" && !almacenOrigen}
            />

            {items.length > 0 && (
              <div className="rounded-xl border border-border">
                {items.map((item) => (
                  <div
                    key={item.uniqueKey}
                    className="flex items-center justify-between gap-3 border-b border-border/60 px-3 py-2 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{item.descripcion}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.marca}
                        {item.sku_label ? ` · ${item.sku_label}` : ""} · Cant: {item.cantidad}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(item.uniqueKey)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!isValid || mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar nota
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
