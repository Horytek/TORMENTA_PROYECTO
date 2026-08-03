import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useQueryState, parseAsString } from "nuqs";
import { isAxiosError } from "axios";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, UserRound, Ban, RotateCcw, Warehouse } from "lucide-react";

import { usePermissions } from "@/hooks/usePermissions";

import { AdaptiveCollection } from "@/components/shared/AdaptiveCollection/AdaptiveCollection";
import type { FieldDef, RecordAction } from "@/components/shared/AdaptiveCollection/types";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import BranchForm from "../components/BranchForm";
import { getSucursales, deleteSucursal, setSucursalEstado } from "../api/branches";
import { getAlmacenes } from "@/features/warehouses/api/warehouses";
import type { Sucursal } from "../types";
import { sucursalVendedor } from "../types";

const extractErrorMessage = (err: unknown): string | undefined =>
  isAxiosError(err) ? err.response?.data?.message : undefined;

export default function BranchesPage() {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useQueryState("q", parseAsString.withDefault(""));
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Sucursal | null>(null);
  const [deleting, setDeleting] = useState<Sucursal | null>(null);
  const [deactivating, setDeactivating] = useState<Sucursal | null>(null);
  const [viewingWarehouses, setViewingWarehouses] = useState<Sucursal | null>(null);

  const { data: almacenes = [] } = useQuery({
    queryKey: ["almacenes"],
    queryFn: getAlmacenes,
    enabled: !!viewingWarehouses,
  });
  const almacenesDeLaSucursal = almacenes.filter((a) => a.id_sucursal === viewingWarehouses?.id_sucursal);

  const { can } = usePermissions();
  const canEdit = can("sucursal.edit");
  const canDelete = can("sucursal.delete");

  const { data: sucursales = [], isLoading } = useQuery<Sucursal[]>({
    queryKey: ["sucursales"],
    queryFn: getSucursales,
  });

  const deleteMutation = useMutation({
    mutationFn: (s: Sucursal) => deleteSucursal(s.id_sucursal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sucursales"] });
      setDeleting(null);
    },
  });

  const setEstadoMutation = useMutation({
    mutationFn: ({ s, estado }: { s: Sucursal; estado: number }) => setSucursalEstado(s.id_sucursal, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sucursales"] });
      setDeactivating(null);
    },
  });

  const openCreate = () => {
    setEditing(null);
    setIsFormOpen(true);
  };
  const openEdit = (s: Sucursal) => {
    setEditing(s);
    setIsFormOpen(true);
  };

  // ── Fields para AdaptiveCard ──────────────────────────────
  const fields: FieldDef<Sucursal>[] = [
    {
      key: "nombre_sucursal",
      label: "Sucursal",
      priority: "primary",
      semantic: "title",
    },
    {
      key: "ubicacion",
      label: "Ubicación",
      priority: "secondary",
      semantic: "subtitle",
    },
    {
      key: "estado_sucursal",
      label: "Estado",
      priority: "secondary",
      semantic: "status-dot",
      format: (v) => (Number(v) === 1 ? "Activa" : "Inactiva"),
    },
    {
      key: "vendedor",
      label: "Vendedor",
      priority: "secondary",
      semantic: "icon-text",
      render: (_v, item) => {
        const v = sucursalVendedor(item);
        if (!v || v === "Sin asignar") {
          return <span className="text-muted-foreground/50 italic text-xs">Sin vendedor asignado</span>;
        }
        return (
          <span className="flex items-center gap-1.5 min-w-0">
            <UserRound className="h-3 w-3 shrink-0 text-muted-foreground/70" />
            <span className="truncate text-muted-foreground">{v}</span>
          </span>
        );
      },
    },
    {
      key: "id_sucursal",
      label: "ID",
      priority: "meta",
      semantic: "code",
    },
  ];

  // ── Acciones de registro ─────────────────────────────────
  const actions: RecordAction[] = [
    {
      id: "warehouses",
      label: "Ver almacenes",
      icon: <Warehouse className="h-3.5 w-3.5" />,
      onClick: (item) => setViewingWarehouses(item as Sucursal),
    },
    {
      id: "edit",
      label: "Editar",
      icon: <Pencil className="h-3.5 w-3.5" />,
      onClick: (item) => openEdit(item as Sucursal),
      disabled: !canEdit,
    },
    {
      id: "deactivate",
      label: "Desactivar",
      icon: <Ban className="h-3.5 w-3.5" />,
      onClick: (item) => setDeactivating(item as Sucursal),
      hidden: (item) => Number((item as Sucursal).estado_sucursal) !== 1,
      disabled: !canEdit,
      variant: "secondary",
    },
    {
      id: "reactivate",
      label: "Reactivar",
      icon: <RotateCcw className="h-3.5 w-3.5" />,
      onClick: (item) => setEstadoMutation.mutate({ s: item as Sucursal, estado: 1 }),
      hidden: (item) => Number((item as Sucursal).estado_sucursal) === 1,
      disabled: !canEdit,
      variant: "secondary",
    },
    {
      id: "delete",
      label: "Eliminar",
      icon: <Trash2 className="h-3.5 w-3.5" />,
      onClick: (item) => setDeleting(item as Sucursal),
      variant: "destructive",
      disabled: !canDelete,
    },
  ];

  return (
    <>
      <AdaptiveCollection<Sucursal>
        title="Sucursales"
        items={sucursales}
        fields={fields}
        actions={actions}
        isLoading={isLoading}
        search={searchTerm}
        searchPlaceholder="Buscar por nombre, ubicación o vendedor…"
        onSearch={setSearchTerm}
        layout="auto"
        getItemId={(s) => s.id_sucursal}
        empty={{
          title: "No se encontraron sucursales",
          description: searchTerm ? "Ajusta el término de búsqueda." : "Registra tu primera sucursal.",
          action: !searchTerm && canEdit ? { label: "Nueva sucursal", onClick: openCreate } : undefined,
        }}
        globalActions={
          canEdit
            ? [
                {
                  id: "create",
                  label: "Nueva sucursal",
                  icon: <Plus className="h-4 w-4" />,
                  onClick: () => openCreate(),
                },
              ]
            : []
        }
      />

      {isFormOpen && (
        <BranchForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} initialData={editing} />
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => { setDeleting(null); deleteMutation.reset(); }}
        onConfirm={() => deleting && deleteMutation.mutate(deleting)}
        title="¿Eliminar sucursal?"
        description={
          <>
            Esta acción es permanente y no se puede deshacer.
            <br />
            <span className="mt-1 inline-block font-medium text-foreground">
              {deleting?.nombre_sucursal ?? ""}
            </span>
          </>
        }
        confirmLabel="Eliminar"
        variant="danger"
        isPending={deleteMutation.isPending}
        error={deleteMutation.isError ? extractErrorMessage(deleteMutation.error) ?? "No se pudo eliminar la sucursal." : null}
      />

      <ConfirmDialog
        open={!!deactivating}
        onClose={() => { setDeactivating(null); setEstadoMutation.reset(); }}
        onConfirm={() => deactivating && setEstadoMutation.mutate({ s: deactivating, estado: 0 })}
        title="¿Desactivar sucursal?"
        description={
          <>
            Deja de aparecer como destino disponible al registrar ventas o traslados; podés reactivarla cuando quieras.
            <br />
            <span className="mt-1 inline-block font-medium text-foreground">
              {deactivating?.nombre_sucursal ?? ""}
            </span>
          </>
        }
        confirmLabel="Desactivar"
        isPending={setEstadoMutation.isPending}
        error={setEstadoMutation.isError ? extractErrorMessage(setEstadoMutation.error) ?? "No se pudo desactivar la sucursal." : null}
      />

      {/* Almacenes de la sucursal — la relación vive del lado del almacén
          (almacen.id_sucursal), así que esto es de solo lectura acá; para
          reasignar hay que ir al módulo de Almacenes (enlace abajo). */}
      <Sheet open={!!viewingWarehouses} onOpenChange={(o) => !o && setViewingWarehouses(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Warehouse className="h-4 w-4" /> Almacenes de {viewingWarehouses?.nombre_sucursal}
            </SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-4 space-y-2">
            {almacenesDeLaSucursal.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Esta sucursal no tiene almacenes asignados.
              </p>
            ) : (
              almacenesDeLaSucursal.map((a) => (
                <div key={a.id_almacen} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium text-foreground">{a.nom_almacen}</p>
                    <p className="text-xs text-muted-foreground">{a.ubicacion || "Sin ubicación"}</p>
                  </div>
                  <span className="font-semibold text-foreground">{a.stock_total ?? 0} u.</span>
                </div>
              ))
            )}
            <Button asChild variant="outline" size="sm" className="w-full mt-2">
              <Link to="/logistics/warehouses">Gestionar almacenes</Link>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
