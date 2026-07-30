import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2, PackageSearch, BookmarkPlus, ClipboardCheck } from "lucide-react";

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
import { usePermissions } from "@/hooks/usePermissions";

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
  insertTransferenciaAlmacen,
} from "../api/warehouseNotes";
import type { NoteKind, NoteFormItem, NotaInsertPayload } from "../types";
import { listarPlantillas, guardarPlantilla, eliminarPlantilla, type PlantillaNota } from "../lib/plantillas";

/** "conjunto" = registra una salida y un ingreso a la vez (traslado entre almacenes). */
type Mode = NoteKind | "conjunto";

const GLOSAS_INGRESO = [
  "COMPRA EN EL PAIS", "COMPRA EN EL EXTERIOR", "TRANSFERENCIA ENTRE ALMACENES",
  "DEVOLUCION", "AJUSTE INVENTARIO", "OTROS INGRESOS",
];
const GLOSAS_SALIDA = [
  "VENTA DE PRODUCTOS", "CONSIGNACION CLIENTE", "TRASLADO ENTRE ALMACENES",
  "MATERIA PRIMA PRODUCCION", "DEVOLUCION PROVEEDOR", "AJUSTE INVENTARIO", "OTRAS SALIDAS",
];
const GLOSAS: Record<Mode, string[]> = {
  ingreso: GLOSAS_INGRESO,
  salida: GLOSAS_SALIDA,
  conjunto: Array.from(new Set([...GLOSAS_INGRESO, ...GLOSAS_SALIDA])),
};

/** Sentinel para "sin selección" — Radix Select no permite value="". */
const NONE = "__none__";

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
  const { isAdmin } = usePermissions();

  const [tipoNota, setTipoNota] = useState<Mode>(defaultTipo);
  const [items, setItems] = useState<NoteFormItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [plantillas, setPlantillas] = useState<PlantillaNota[]>([]);

  useEffect(() => {
    if (isOpen) {
      setTipoNota(defaultTipo);
      setItems([]);
      setError(null);
      setPlantillas(listarPlantillas());
    }
  }, [isOpen, defaultTipo]);

  const { control, register, handleSubmit, watch, reset, setValue } = useForm<HeaderValues>({ defaultValues: emptyHeader });
  const almacenOrigen = watch("almacenOrigen");

  // Al cargar una plantilla, cambiar tipoNota dispara este mismo efecto — sin
  // esta bandera, el reset borraría los datos que la plantilla acaba de poner.
  const cargandoPlantillaRef = useRef(false);
  useEffect(() => {
    if (cargandoPlantillaRef.current) {
      cargandoPlantillaRef.current = false;
      return;
    }
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

  // Los correlativos de ingreso y salida son secuencias distintas; en modo "conjunto" se
  // necesitan ambos a la vez, así que se piden siempre en vez de condicionar por tipoNota.
  const { data: documentosIngreso = [] } = useQuery({
    queryKey: ["nota-almacen-documentos", "ingreso"],
    queryFn: getDocumentosIngreso,
    enabled: isOpen,
  });
  const { data: documentosSalida = [] } = useQuery({
    queryKey: ["nota-almacen-documentos", "salida"],
    queryFn: getDocumentosSalida,
    enabled: isOpen,
  });

  const numeroDocumentoIngreso = documentosIngreso[0]?.nuevo_numero_de_nota ?? "";
  const numeroDocumentoSalida = documentosSalida[0]?.nuevo_numero_de_nota ?? "";
  const numeroDocumento = tipoNota === "salida" ? numeroDocumentoSalida : numeroDocumentoIngreso;

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

  const handleGuardarPlantilla = () => {
    if (items.length === 0) return;
    const nombre = window.prompt("Nombre de la plantilla (ej. \"Reposición semanal tienda X\"):");
    if (!nombre?.trim()) return;
    const nueva = guardarPlantilla({
      nombre: nombre.trim(), tipo: tipoNota, destinatario: watch("destinatario"), glosa: watch("glosa"), items,
    });
    setPlantillas((prev) => [...prev, nueva]);
  };

  const handleCargarPlantilla = (id: string) => {
    const p = plantillas.find((pl) => pl.id === id);
    if (!p) return;
    cargandoPlantillaRef.current = true;
    setTipoNota(p.tipo as Mode);
    setValue("destinatario", p.destinatario);
    setValue("glosa", p.glosa);
    setItems(p.items);
  };

  const handleEliminarPlantilla = (id: string) => {
    eliminarPlantilla(id);
    setPlantillas((prev) => prev.filter((p) => p.id !== id));
  };

  const mutation = useMutation({
    mutationFn: async (values: HeaderValues) => {
      const itemFields = {
        producto: items.map((i) => i.codigo),
        cantidad: items.map((i) => i.cantidad),
        tonalidad: items.map((i) => i.id_tonalidad),
        talla: items.map((i) => i.id_talla),
        sku: items.map((i) => i.id_sku),
      };
      const common = {
        destinatario: values.destinatario,
        glosa: values.glosa,
        nota: values.nota,
        fecha: buildFechaCompleta(values.fecha),
        observacion: values.observacion,
        ...itemFields,
      };

      if (tipoNota === "conjunto") {
        // Una sola transacción en el backend (transferenciaAlmacen.controller.js):
        // si el ingreso falla, la salida también se revierte — antes eran dos
        // POST independientes y un fallo a mitad de camino perdía el stock.
        return insertTransferenciaAlmacen({
          ...common,
          almacenO: values.almacenOrigen,
          almacenD: values.almacenDestino,
          numComprobanteSalida: numeroDocumentoSalida,
          numComprobanteIngreso: numeroDocumentoIngreso,
          usuario: user?.username ?? "",
        });
      }

      const payload: NotaInsertPayload = {
        ...common,
        almacenO: tipoNota === "salida" ? values.almacenOrigen : values.almacenOrigen || null,
        almacenD: tipoNota === "ingreso" ? values.almacenDestino : values.almacenDestino || null,
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

  const documentosListos =
    tipoNota === "conjunto" ? !!numeroDocumentoIngreso && !!numeroDocumentoSalida : !!numeroDocumento;
  const origenOk = tipoNota === "ingreso" || !!watch("almacenOrigen");
  const destinoOk = tipoNota === "salida" || !!watch("almacenDestino");

  const isValid =
    !!user?.username &&
    documentosListos &&
    origenOk &&
    destinoOk &&
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
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva nota de almacén</DialogTitle>
          <DialogDescription>Registra un movimiento de ingreso o salida de inventario.</DialogDescription>
        </DialogHeader>

        <div className="flex gap-1.5 rounded-lg bg-muted p-1">
          {(["ingreso", "salida", "conjunto"] as Mode[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setTipoNota(k)}
              className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                tipoNota === k ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              {k === "ingreso" ? "Ingreso" : k === "salida" ? "Salida" : "Conjunto"}
            </button>
          ))}
        </div>

        {plantillas.length > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2">
            <ClipboardCheck className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <Select onValueChange={handleCargarPlantilla}>
              <SelectTrigger className="h-8 flex-1 text-xs"><SelectValue placeholder="Cargar una plantilla…" /></SelectTrigger>
              <SelectContent>
                {plantillas.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2 pr-2">
                    <SelectItem value={p.id} className="text-xs flex-1">{p.nombre}</SelectItem>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-destructive cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); handleEliminarPlantilla(p.id); }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {tipoNota === "conjunto" ? (
              <>
                <FormField label="N° de salida">
                  <Input value={numeroDocumentoSalida} disabled placeholder="Cargando…" />
                </FormField>
                <FormField label="N° de ingreso">
                  <Input value={numeroDocumentoIngreso} disabled placeholder="Cargando…" />
                </FormField>
              </>
            ) : (
              <FormField label="N° de documento">
                <Input value={numeroDocumento} disabled placeholder="Cargando…" />
              </FormField>
            )}

            <FormField label="Fecha" htmlFor="fecha">
              <Input id="fecha" type="date" {...register("fecha", { required: true })} />
            </FormField>

            <FormField label="Almacén origen" optional={tipoNota === "ingreso"} hint={tipoNota === "ingreso" ? "Solo si es traslado entre almacenes" : undefined}>
              <Controller
                control={control}
                name="almacenOrigen"
                rules={{ required: tipoNota !== "ingreso" }}
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={(v) => field.onChange(v === NONE ? "" : v)}>
                    <SelectTrigger><SelectValue placeholder="Selecciona almacén de origen" /></SelectTrigger>
                    <SelectContent>
                      {tipoNota === "ingreso" && <SelectItem value={NONE} className="text-muted-foreground">— Ninguno —</SelectItem>}
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
                rules={{ required: tipoNota !== "salida" }}
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={(v) => field.onChange(v === NONE ? "" : v)}>
                    <SelectTrigger><SelectValue placeholder="Selecciona almacén de destino" /></SelectTrigger>
                    <SelectContent>
                      {tipoNota === "salida" && <SelectItem value={NONE} className="text-muted-foreground">— Ninguno —</SelectItem>}
                      {almacenesFiltrados.map((a) => (
                        <SelectItem key={a.id} value={String(a.id)}>{a.almacen}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField label={tipoNota === "ingreso" ? "Proveedor" : tipoNota === "conjunto" ? "Destinatario / Proveedor" : "Destinatario"}>
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
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <PackageSearch className="h-4 w-4" /> Productos
              </div>
              {items.length > 0 && (
                <Button type="button" variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={handleGuardarPlantilla}>
                  <BookmarkPlus className="h-3.5 w-3.5" /> Guardar como plantilla
                </Button>
              )}
            </div>
            <ProductPickerPanel
              tipo={tipoNota === "ingreso" ? "ingreso" : "salida"}
              almacen={almacenOrigen}
              items={items}
              onAdd={addItem}
              disabled={tipoNota !== "ingreso" && !almacenOrigen}
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
                        {item.marca} · Cant: {item.cantidad}
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
