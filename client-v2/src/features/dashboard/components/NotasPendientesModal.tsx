import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Info, AlertTriangle, Check, Trash2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import {
  insertNotaIngreso,
  insertNotaSalida,
  anularNotaIngreso,
  anularNotaSalida,
  getDocumentosIngreso,
  getDocumentosSalida,
} from "@/features/warehouse-notes/api/warehouseNotes";
import { actualizarEstadoEspera, type NotaPendiente } from "../api/dashboard";

interface NotasPendientesModalProps {
  open: boolean;
  onClose: () => void;
  notas: NotaPendiente[];
  refetchNotas: () => void;
  usuarioName: string;
}

export function NotasPendientesModal({
  open,
  onClose,
  notas,
  refetchNotas,
  usuarioName,
}: NotasPendientesModalProps) {
  const [activeTab, setActiveTab] = useState<"falta-salida" | "falta-ingreso">("falta-salida");
  const [isProcessing, setIsProcessing] = useState(false);

  // Separar las notas por tipo
  // En el original: "Falta salida" y "Falta ingreso"
  const notasFaltaSalida = notas.filter((n) => n.tipo_nota === "Falta salida" || (n as any).tipo === "Falta salida");
  const notasFaltaIngreso = notas.filter((n) => n.tipo_nota === "Falta ingreso" || (n as any).tipo === "Falta ingreso");

  const listToRender = activeTab === "falta-salida" ? notasFaltaSalida : notasFaltaIngreso;

  // Formato simple de fecha
  const formatFecha = (fechaStr: string) => {
    if (!fechaStr) return "";
    try {
      const d = new Date(fechaStr);
      if (isNaN(d.getTime())) return fechaStr;
      return d.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return fechaStr;
    }
  };

  const handleApprove = async (nota: any) => {
    try {
      if (!nota.id_destinatario && !(nota as any).destinatario) {
        alert("La nota no tiene destinatario asignado.");
        return;
      }

      setIsProcessing(true);
      const isIngreso = nota.tipo_nota === "Falta ingreso" || (nota as any).tipo === "Falta ingreso";

      // Extraer arreglos de productos, cantidades y variantes
      const detalles = (nota as any).detalles || [];
      const producto = detalles.length > 0 ? detalles.map((d: any) => d.id_producto) : [nota.id_producto];
      const cantidad = detalles.length > 0 ? detalles.map((d: any) => d.cantidad) : [nota.cantidad];
      const tonalidad = detalles.length > 0 ? detalles.map((d: any) => d.id_tonalidad ?? null) : [nota.id_tonalidad ?? null];
      const talla = detalles.length > 0 ? detalles.map((d: any) => d.id_talla ?? null) : [nota.id_talla ?? null];
      const sku = detalles.length > 0 ? detalles.map((d: any) => d.id_sku ?? null) : [nota.id_sku ?? null];

      let nuevoNumComprobante = "-";
      let result;

      const dateStr = new Date().toISOString().slice(0, 19).replace("T", " ");

      if (isIngreso) {
        // Obtener correlativo
        const docs = await getDocumentosIngreso();
        if (docs && docs.length > 0) {
          nuevoNumComprobante = docs[0].nota || docs[0].nuevo_numero_de_nota || "-";
        }

        result = await insertNotaIngreso({
          almacenO: (nota as any).id_almacenO || (nota as any).almacen_origen_id || null,
          almacenD: (nota as any).id_almacenD || (nota as any).almacen_destino_id || null,
          destinatario: nota.id_destinatario || (nota as any).destinatario,
          glosa: nota.concepto || "INGRESO AUTOMÁTICO",
          nota: "INGRESO",
          fecha: dateStr,
          producto,
          cantidad,
          tonalidad,
          talla,
          sku,
          numComprobante: nuevoNumComprobante,
          observacion: (nota as any).observacion || "",
          usuario: usuarioName,
        });
      } else {
        const docs = await getDocumentosSalida();
        if (docs && docs.length > 0) {
          nuevoNumComprobante = docs[0].nota || docs[0].nuevo_numero_de_nota || "-";
        }

        result = await insertNotaSalida({
          almacenO: (nota as any).id_almacenO || (nota as any).almacen_origen_id || null,
          almacenD: (nota as any).id_almacenD || (nota as any).almacen_destino_id || null,
          destinatario: nota.id_destinatario || (nota as any).destinatario,
          glosa: nota.concepto || "SALIDA AUTOMÁTICA",
          nota: "SALIDA",
          fecha: dateStr,
          producto,
          cantidad,
          tonalidad,
          talla,
          sku,
          numComprobante: nuevoNumComprobante,
          observacion: (nota as any).observacion || "",
          nom_usuario: usuarioName,
        });
      }

      if (result && result.success) {
        // Actualizar estado_espera nota original
        await actualizarEstadoEspera(nota.num_comprobante || nota.documento);
        // Actualizar estado_espera nueva nota generada
        if (nuevoNumComprobante !== "-") {
          await actualizarEstadoEspera(nuevoNumComprobante);
        }
        alert("Contraparte registrada correctamente.");
        refetchNotas();
      } else {
        alert(result?.message || "No se pudo registrar la contraparte.");
      }
    } catch (err) {
      console.error(err);
      alert("Error al registrar la contraparte.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnnul = async (nota: any) => {
    if (!window.confirm("¿Está seguro de que desea anular esta nota pendiente?")) return;

    try {
      setIsProcessing(true);
      const isIngreso = nota.tipo_nota === "Falta ingreso" || (nota as any).tipo === "Falta ingreso";
      const idNota = nota.id_nota_almacen || nota.id_nota;

      let ok = false;
      if (isIngreso) {
        // En el original: si falta ingreso es porque falta registrar el ingreso de una salida previa,
        // por lo tanto anulamos la salida original que generó esta espera
        ok = await anularNotaSalida(idNota, usuarioName);
      } else {
        ok = await anularNotaIngreso(idNota, usuarioName);
      }

      if (ok) {
        alert("Nota anulada correctamente.");
        refetchNotas();
      } else {
        alert("No se pudo anular la nota.");
      }
    } catch (err) {
      console.error(err);
      alert("Error al anular la nota.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl border-border bg-card max-h-[85vh] overflow-hidden flex flex-col p-6 gap-4">
        <DialogHeader className="pb-2 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Notas en Espera de Confirmación
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ingresos o salidas entre almacenes que están a la espera de contraparte.
          </p>
        </DialogHeader>

        {/* Tab Buttons */}
        <div className="flex gap-1.5 p-1 bg-muted/40 rounded-lg w-fit self-start shrink-0">
          <Button
            variant={activeTab === "falta-salida" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("falta-salida")}
            className="text-xs font-semibold h-8"
          >
            Falta Salida ({notasFaltaSalida.length})
          </Button>
          <Button
            variant={activeTab === "falta-ingreso" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("falta-ingreso")}
            className="text-xs font-semibold h-8"
          >
            Falta Ingreso ({notasFaltaIngreso.length})
          </Button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto pr-1">
          {listToRender.length > 0 ? (
            <div className="space-y-3">
              {listToRender.map((nota, i) => (
                <div
                  key={nota.id_nota_almacen || i}
                  className="p-3 border border-border bg-zinc-50/30 dark:bg-zinc-950/20 rounded-xl space-y-2.5 transition-shadow hover:shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-foreground">
                          {nota.num_comprobante || (nota as any).documento}
                        </span>
                        <Badge variant="outline" className="text-[9px] font-semibold uppercase">
                          {nota.concepto || "Traspaso"}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Registrado por: <span className="font-medium text-foreground">{nota.usuario_registra || (nota as any).usuario}</span> · Sucursal: {nota.nombre_sucursal || (nota as any).sucursal}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="num font-mono text-[10px] text-muted-foreground block">
                        {formatFecha(nota.fecha)}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground flex gap-1.5 flex-wrap items-center">
                    <span className="font-semibold text-foreground">Glosa:</span>
                    <span>{nota.glosa || "—"}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 justify-end pt-1 border-t border-border">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-7 text-[10px] font-bold gap-1"
                      disabled={isProcessing}
                      onClick={() => handleAnnul(nota)}
                    >
                      <Trash2 className="h-3 w-3" />
                      Anular nota
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="h-7 text-[10px] font-bold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      disabled={isProcessing}
                      onClick={() => handleApprove(nota)}
                    >
                      <Check className="h-3 w-3" />
                      Aprobar / Confirmar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Info className="h-8 w-8 mb-2 text-muted-foreground/60" />
              <p className="text-xs font-semibold">No hay notas pendientes en esta categoría.</p>
            </div>
          )}
        </div>

        <div className="border-t border-border pt-3 flex justify-end shrink-0">
          <Button variant="ghost" onClick={onClose} size="sm" className="text-xs font-semibold">
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
