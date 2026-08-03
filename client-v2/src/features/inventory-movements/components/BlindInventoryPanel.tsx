import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, EyeOff, Scale, ClipboardList } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAlmacenesSalida } from "@/features/warehouse-notes/api/warehouseNotes";
import { getBlindCountSessions, createBlindCountSession } from "../api/inventoryMovements";
import type { BlindCountSession } from "../types";
import { BlindCountDialog } from "./BlindCountDialog";
import { ReconciliationDialog } from "./ReconciliationDialog";

export const BlindInventoryPanel = () => {
  const queryClient = useQueryClient();

  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newAlmacen, setNewAlmacen] = useState<string>("");
  const [newTitulo, setNewTitulo] = useState("");
  const [newObservaciones, setNewObservaciones] = useState("");

  const [activeBlindCount, setActiveBlindCount] = useState<BlindCountSession | null>(null);
  const [isCountOpen, setIsCountOpen] = useState(false);

  const [activeReconcile, setActiveReconcile] = useState<BlindCountSession | null>(null);
  const [isReconcileOpen, setIsReconcileOpen] = useState(false);

  const { data: almacenes = [] } = useQuery({
    queryKey: ["almacenes-blind-counts"],
    queryFn: getAlmacenesSalida,
  });

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["blind-count-sessions"],
    queryFn: () => getBlindCountSessions(),
  });

  const createMut = useMutation({
    mutationFn: createBlindCountSession,
    onSuccess: () => {
      toast.success("Sesión de conteo ciego iniciada exitosamente");
      queryClient.invalidateQueries({ queryKey: ["blind-count-sessions"] });
      setIsNewOpen(false);
      setNewTitulo("");
      setNewObservaciones("");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err.message || "Error al iniciar sesión de conteo");
    },
  });

  const handleCreate = () => {
    if (!newAlmacen || !newTitulo.trim()) {
      toast.error("Seleccione almacén e ingrese un título descriptivo");
      return;
    }
    createMut.mutate({
      id_almacen: Number(newAlmacen),
      titulo: newTitulo.trim(),
      observaciones: newObservaciones,
    });
  };

  const getBadge = (estado: string) => {
    switch (estado) {
      case "EN_PROCESO":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">En Conteo</Badge>;
      case "CONTEO_COMPLETADO":
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">Conteo Listo</Badge>;
      case "APLICADO":
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Ajuste Aplicado</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Auditorías e Inventario Físico Ciego</h3>
          <p className="text-xs text-gray-500">Conteo imparcial de stock sin exponer las cantidades del sistema a los operadores.</p>
        </div>

        <Button onClick={() => setIsNewOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5">
          <Plus className="w-4 h-4" /> Iniciar Nueva Auditoría
        </Button>
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center items-center">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="border border-dashed rounded-lg py-12 text-center text-gray-500 bg-white">
          <ClipboardList className="w-10 h-10 mx-auto text-gray-300 mb-2" />
          <p className="font-medium text-sm">No hay sesiones de conteo ciego activas</p>
          <p className="text-xs text-gray-400 mt-1">Inicia una auditoría para verificar el stock físico real.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
          <div className="divide-y">
            {sessions.map((s) => (
              <div key={s.id_inventario_fisico} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-indigo-900 text-sm">{s.codigo_conteo}</span>
                    {getBadge(s.estado)}
                    <span className="text-xs font-semibold text-gray-800">{s.titulo}</span>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <span>Almacén: <strong>{s.nom_almacen || `#${s.id_almacen}`}</strong></span>
                    <span>•</span>
                    <span>Creado: {new Date(s.f_creacion).toLocaleDateString("es-PE")}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {s.estado !== "APLICADO" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setActiveBlindCount(s);
                        setIsCountOpen(true);
                      }}
                      className="gap-1.5 text-xs text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                    >
                      <EyeOff className="w-3.5 h-3.5" /> Ingresar Conteo
                    </Button>
                  )}

                  <Button
                    size="sm"
                    onClick={() => {
                      setActiveReconcile(s);
                      setIsReconcileOpen(true);
                    }}
                    className={
                      s.estado === "APLICADO"
                        ? "bg-gray-100 hover:bg-gray-200 text-gray-800 gap-1.5 text-xs"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs"
                    }
                  >
                    <Scale className="w-3.5 h-3.5" /> Reconciliación & Ajuste
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Nueva Sesión */}
      <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Iniciar Sesión de Conteo Físico Ciego</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-semibold text-gray-700">Almacén a Auditar</label>
              <Select value={newAlmacen} onValueChange={setNewAlmacen}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccionar almacén..." />
                </SelectTrigger>
                <SelectContent>
                  {almacenes.map((a: any) => (
                    <SelectItem key={a.id_almacen} value={String(a.id_almacen)}>
                      {a.nom_almacen}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700">Título / Descripción del Conteo</label>
              <Input
                value={newTitulo}
                onChange={(e) => setNewTitulo(e.target.value)}
                placeholder="Ej. Conteo Trimestral Almacén Central"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700">Observaciones</label>
              <Input
                value={newObservaciones}
                onChange={(e) => setNewObservaciones(e.target.value)}
                placeholder="Opcional..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsNewOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={createMut.isPending}>
              {createMut.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              Iniciar Conteo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Conteo Ciego */}
      <BlindCountDialog
        session={activeBlindCount}
        isOpen={isCountOpen}
        onClose={() => {
          setIsCountOpen(false);
          setActiveBlindCount(null);
        }}
      />

      {/* Modal Reconciliación */}
      <ReconciliationDialog
        session={activeReconcile}
        isOpen={isReconcileOpen}
        onClose={() => {
          setIsReconcileOpen(false);
          setActiveReconcile(null);
        }}
      />
    </div>
  );
};
