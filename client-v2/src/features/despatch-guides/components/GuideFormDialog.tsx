import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2, PackageSearch, UserPlus, Truck, CheckCircle2, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormField } from "@/components/shared/FormField";
import { useUserStore } from "@/store/useUserStore";

import { GuideProductPicker } from "./GuideProductPicker";
import { UbigeoFieldGroup, useUbigeoIndex, emptyUbigeoSelection, type UbigeoSelection } from "./UbigeoFields";
import { NewDestinatarioDialog } from "./NewDestinatarioDialog";
import { NewTransportistaDialog } from "./NewTransportistaDialog";
import {
  getSucursalesGuia,
  getDestinatariosGuia,
  getUbigeosGuia,
  generarDocumentoGuia,
  getTransportistasPublicos,
  getTransportistasPrivados,
  insertGuiaRemisionAndDetalle,
  getEmpresaSunatData,
} from "../api/guides";
import { emitirGuiaSunat } from "../api/sunat";
import type { GuideFormItem, GuideInsertPayload } from "../types";

const GLOSA_OPTIONS = [
  "COMPRA", "VENTA CON ENTREGA A TERCEROS", "TRASLADO ENTRE ALMACENES DE LA MISMA CIA.",
  "CONSIGNACION", "DEVOLUCION", "RECOJO DE BIENES TRANSFORMADOS",
  "IMPORTACION", "EXPORTACION", "OTROS", "VENTA SUJETA A CONFIRMACION DEL COMPRADOR",
  "TRASLADO DE BIENES PARA TRANSFORMACION", "TRASLADO EMISOR ITINERANTE CP",
];

interface HeaderValues {
  sucursal: string;
  destinatario: string;
  glosa: string;
  observacion: string;
  canti: string;
  peso: string;
}

const emptyHeader: HeaderValues = { sucursal: "", destinatario: "", glosa: "", observacion: "", canti: "", peso: "" };

interface GuideFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GuideFormDialog({ isOpen, onClose }: GuideFormDialogProps) {
  const queryClient = useQueryClient();
  const user = useUserStore((s) => s.user);
  const idEmpresa = useUserStore((s) => s.id_empresa);

  const [items, setItems] = useState<GuideFormItem[]>([]);
  const [origen, setOrigen] = useState<UbigeoSelection>(emptyUbigeoSelection);
  const [destino, setDestino] = useState<UbigeoSelection>(emptyUbigeoSelection);
  const [transporteTab, setTransporteTab] = useState<"publico" | "privado">("publico");
  const [transportistaId, setTransportistaId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isNewDestinatarioOpen, setIsNewDestinatarioOpen] = useState(false);
  const [isNewTransportistaOpen, setIsNewTransportistaOpen] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; sunatOk: boolean; sunatMessage?: string } | null>(null);

  const { control, register, handleSubmit, watch, reset, setValue } = useForm<HeaderValues>({ defaultValues: emptyHeader });
  const sucursalId = watch("sucursal");

  useEffect(() => {
    if (isOpen) {
      reset(emptyHeader);
      setItems([]);
      setOrigen(emptyUbigeoSelection);
      setDestino(emptyUbigeoSelection);
      setTransporteTab("publico");
      setTransportistaId("");
      setError(null);
      setResult(null);
    }
  }, [isOpen, reset]);

  const { data: sucursales = [] } = useQuery({ queryKey: ["guia-sucursales"], queryFn: getSucursalesGuia, enabled: isOpen });

  const uniqueSucursales = useMemo(() => {
    const seen = new Set<string>();
    return sucursales.filter((s) => {
      const name = s.nombre?.trim();
      if (!name || seen.has(name)) return false;
      seen.add(name);
      return true;
    });
  }, [sucursales]);
  const { data: destinatarios = [] } = useQuery({ queryKey: ["guia-destinatarios"], queryFn: getDestinatariosGuia, enabled: isOpen });
  const { data: ubigeos = [] } = useQuery({ queryKey: ["guia-ubigeos"], queryFn: getUbigeosGuia, enabled: isOpen });
  const { data: documento } = useQuery({ queryKey: ["guia-documento"], queryFn: generarDocumentoGuia, enabled: isOpen });
  const { data: transportistasPublicos = [] } = useQuery({
    queryKey: ["guia-transportistas-publicos"], queryFn: getTransportistasPublicos, enabled: isOpen,
  });
  const { data: transportistasPrivados = [] } = useQuery({
    queryKey: ["guia-transportistas-privados"], queryFn: getTransportistasPrivados, enabled: isOpen,
  });

  const ubigeoIndex = useUbigeoIndex(ubigeos);
  const numeroDocumento = documento?.nuevo_numero_de_guia ?? "";

  const sucursalSeleccionada = useMemo(() => sucursales.find((s) => String(s.id) === sucursalId), [sucursales, sucursalId]);
  const destinatarioSeleccionado = useMemo(
    () => destinatarios.find((d) => String(d.id) === watch("destinatario")),
    [destinatarios, watch]
  );

  const addItem = (item: GuideFormItem) => {
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
    mutationFn: async (values: HeaderValues) => {
      const now = new Date();
      const fecha = now.toISOString().slice(0, 10);
      const hora = now.toLocaleTimeString("en-GB", { hour12: false });

      const transportistaPub =
        transporteTab === "publico"
          ? transportistasPublicos.find((t) => t.id === transportistaId)
          : undefined;
      const transportistaPriv =
        transporteTab === "privado"
          ? transportistasPrivados.find((t) => t.id === transportistaId)
          : undefined;

      const payload: GuideInsertPayload = {
        id_sucursal: values.sucursal,
        id_ubigeo_o: ubigeoIndex.resolveId(origen) ?? 0,
        id_ubigeo_d: ubigeoIndex.resolveId(destino) ?? 0,
        id_destinatario: values.destinatario,
        id_transportista: transportistaId,
        glosa: values.glosa,
        dir_partida: sucursalSeleccionada?.direccion,
        dir_destino: destinatarioSeleccionado?.ubicacion,
        canti: values.canti,
        peso: values.peso,
        observacion: values.observacion,
        f_generacion: fecha,
        h_generacion: hora,
        producto: items.map((i) => i.codigo),
        num_comprobante: numeroDocumento,
        cantidad: items.map((i) => i.cantidad),
        tonalidad: items.map((i) => i.id_tonalidad),
        talla: items.map((i) => i.id_talla),
        sku: items.map((i) => i.id_sku),
      };

      const insertResult = await insertGuiaRemisionAndDetalle(payload);
      if (!insertResult.success) {
        return { insertOk: false, insertMessage: insertResult.message, sunatOk: false };
      }

      // La guía ya quedó guardada localmente; el envío a SUNAT es best-effort
      // (igual que en el flujo legado: un fallo aquí no revierte el registro).
      const empresa = idEmpresa ? await getEmpresaSunatData(idEmpresa).catch(() => null) : null;
      if (!empresa) {
        return { insertOk: true, sunatOk: false, sunatMessage: "No se pudo obtener la información de la empresa para SUNAT." };
      }

      const sunatResult = await emitirGuiaSunat({
        numComprobante: numeroDocumento,
        fechaGeneracion: fecha,
        horaGeneracion: hora,
        glosa: values.glosa,
        empresa,
        destinatario: {
          documento: destinatarioSeleccionado?.documento || "",
          nombre: destinatarioSeleccionado?.destinatario || "",
        },
        ubigeoOrigen: { ubigeo: String(ubigeoIndex.resolveId(origen) ?? ""), direccion: sucursalSeleccionada?.direccion || "" },
        ubigeoDestino: { ubigeo: String(ubigeoIndex.resolveId(destino) ?? ""), direccion: destinatarioSeleccionado?.ubicacion || "" },
        transportista: {
          documento: transportistaPub ? transportistaPub.ruc : transportistaPriv?.dni,
          nombre: transportistaPub ? transportistaPub.razonsocial : transportistaPriv?.transportista,
          placa: transportistaPub ? transportistaPub.placa : transportistaPriv?.placa,
        },
        peso: values.peso,
        items,
      });

      return { insertOk: true, sunatOk: sunatResult.success, sunatMessage: sunatResult.message };
    },
    onSuccess: (res) => {
      if (!res.insertOk) {
        setError(res.insertMessage || "El servidor rechazó el registro. Verifica los datos e intenta de nuevo.");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["guias"] });
      setResult({ ok: true, sunatOk: res.sunatOk, sunatMessage: res.sunatMessage });
    },
    onError: () => setError("No se pudo registrar la guía. Intenta de nuevo."),
  });

  const isValid =
    !!user?.username &&
    !!numeroDocumento &&
    !!sucursalId &&
    !!watch("destinatario") &&
    !!watch("glosa") &&
    !!transportistaId &&
    !!ubigeoIndex.resolveId(origen) &&
    !!ubigeoIndex.resolveId(destino) &&
    items.length > 0;

  const onSubmit = (values: HeaderValues) => {
    setError(null);
    mutation.mutate(values);
  };

  if (result) {
    return (
      <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Guía registrada
            </DialogTitle>
            <DialogDescription>
              La guía <span className="font-mono font-medium text-foreground">{numeroDocumento}</span> se guardó correctamente.
            </DialogDescription>
          </DialogHeader>

          {result.sunatOk ? (
            <p className="flex items-center gap-2 rounded-md border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> Enviada a SUNAT correctamente.
            </p>
          ) : (
            <p className="flex items-start gap-2 rounded-md border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Guardada, pero no se pudo enviar a SUNAT: {result.sunatMessage || "error desconocido"}.</span>
            </p>
          )}

          <DialogFooter>
            <Button onClick={onClose}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva guía de remisión</DialogTitle>
          <DialogDescription>Registra un traslado de mercadería y emítela ante SUNAT.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="N° de guía">
              <Input value={numeroDocumento} disabled placeholder="Cargando…" />
            </FormField>

            <FormField label="Sucursal de origen">
              <Controller
                control={control}
                name="sucursal"
                rules={{ required: true }}
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Selecciona sucursal" /></SelectTrigger>
                    <SelectContent>
                      {uniqueSucursales.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <div className="sm:col-span-2">
              <FormField label="Destinatario">
                <div className="flex gap-2">
                  <Controller
                    control={control}
                    name="destinatario"
                    rules={{ required: true }}
                    render={({ field }) => (
                      <Select value={field.value || undefined} onValueChange={field.onChange}>
                        <SelectTrigger className="flex-1"><SelectValue placeholder="Selecciona destinatario" /></SelectTrigger>
                        <SelectContent>
                          {destinatarios.map((d) => (
                            <SelectItem key={d.id} value={d.id}>{d.destinatario}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={() => setIsNewDestinatarioOpen(true)}>
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
              </FormField>
            </div>

            <div className="sm:col-span-2">
              <FormField label="Motivo de traslado (glosa)">
                <Controller
                  control={control}
                  name="glosa"
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Selecciona un motivo" /></SelectTrigger>
                      <SelectContent>
                        {GLOSA_OPTIONS.map((g) => (
                          <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
            </div>

            <FormField label="Cant. de bultos" htmlFor="canti" optional>
              <Input id="canti" type="number" {...register("canti")} />
            </FormField>
            <FormField label="Peso total (Kg)" htmlFor="peso" optional>
              <Input id="peso" type="number" {...register("peso")} />
            </FormField>
          </div>

          <FormField label="Observaciones" htmlFor="observacion" optional>
            <Textarea id="observacion" rows={2} {...register("observacion")} />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-xl border border-border p-4">
            <UbigeoFieldGroup label="Ubigeo de partida" value={origen} onChange={setOrigen} index={ubigeoIndex} />
            <UbigeoFieldGroup label="Ubigeo de destino" value={destino} onChange={setDestino} index={ubigeoIndex} />
          </div>

          <div className="space-y-2 rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Truck className="h-4 w-4" /> Transportista
              </div>
              <Button type="button" variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => setIsNewTransportistaOpen(true)}>
                <UserPlus className="h-3.5 w-3.5" /> Nuevo
              </Button>
            </div>
            <Tabs value={transporteTab} onValueChange={(v) => { setTransporteTab(v as "publico" | "privado"); setTransportistaId(""); }}>
              <TabsList className="w-full">
                <TabsTrigger value="publico" className="flex-1">Público</TabsTrigger>
                <TabsTrigger value="privado" className="flex-1">Privado</TabsTrigger>
              </TabsList>
            </Tabs>
            <Select value={transportistaId || undefined} onValueChange={setTransportistaId}>
              <SelectTrigger><SelectValue placeholder="Selecciona un transportista" /></SelectTrigger>
              <SelectContent>
                {(transporteTab === "publico" ? transportistasPublicos : transportistasPrivados).map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {"razonsocial" in t ? t.razonsocial : t.transportista}
                    {t.placa ? ` · ${t.placa}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <PackageSearch className="h-4 w-4" /> Productos
            </div>
            <GuideProductPicker almacen={sucursalId} items={items} onAdd={addItem} />

            {items.length > 0 && (
              <div className="rounded-xl border border-border">
                {items.map((item) => (
                  <div key={item.uniqueKey} className="flex items-center justify-between gap-3 border-b border-border/60 px-3 py-2 last:border-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{item.descripcion}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.marca} · Cant: {item.cantidad}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-normal">{item.cantidad}</Badge>
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
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!isValid || mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar y emitir guía
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <NewDestinatarioDialog
        isOpen={isNewDestinatarioOpen}
        onClose={() => setIsNewDestinatarioOpen(false)}
        onCreated={(id) => setValue("destinatario", id)}
      />
      <NewTransportistaDialog
        isOpen={isNewTransportistaOpen}
        onClose={() => setIsNewTransportistaOpen(false)}
        onCreated={() => {}}
      />
    </Dialog>
  );
}
