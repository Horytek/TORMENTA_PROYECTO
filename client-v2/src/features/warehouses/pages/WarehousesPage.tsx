import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useQueryState, parseAsString } from "nuqs";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { usePermissions } from "@/hooks/usePermissions";

import { AdaptiveCollection } from "@/components/shared/AdaptiveCollection/AdaptiveCollection";
import type { FieldDef, RecordAction } from "@/components/shared/AdaptiveCollection/types";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import WarehouseForm from "../components/WarehouseForm";
import { getAlmacenes, deleteAlmacen } from "../api/warehouses";
import type { Almacen } from "../types";

export default function WarehousesPage() {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useQueryState("q", parseAsString.withDefault(""));
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Almacen | null>(null);
  const [deleting, setDeleting] = useState<Almacen | null>(null);

  const { can } = usePermissions();
  const canEdit = can("almaceng.edit");
  const canDelete = can("almaceng.delete");

  const { data: almacenes = [], isLoading } = useQuery<Almacen[]>({
    queryKey: ["almacenes"],
    queryFn: getAlmacenes,
  });

  const deleteMutation = useMutation({
    mutationFn: (a: Almacen) => deleteAlmacen(a.id_almacen),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["almacenes"] });
      setDeleting(null);
    },
  });

  const openCreate = () => {
    setEditing(null);
    setIsFormOpen(true);
  };
  const openEdit = (a: Almacen) => {
    setEditing(a);
    setIsFormOpen(true);
  };

  // ── Fields para AdaptiveCollection ────────────────────────
  const fields: FieldDef<Almacen>[] = [
    {
      key: "nom_almacen",
      label: "Almacén",
      priority: "primary",
      semantic: "title",
    },
    {
      key: "ubicacion",
      label: "Ubicación",
      priority: "secondary",
      semantic: "chip",
      format: (val) => (val as string)?.trim() || "Sin dirección",
    },
    {
      key: "nombre_sucursal",
      label: "Sucursal",
      priority: "secondary",
      semantic: "chip",
      format: (val) => (val as string)?.trim() || "General",
    },
    {
      key: "estado_almacen",
      label: "Estado",
      priority: "secondary",
      semantic: "badge",
      format: (val) => (Number(val) === 1 ? "Activo" : "Inactivo"),
    },
    {
      key: "stock_total",
      label: "Stock total",
      priority: "secondary",
      semantic: "number",
      format: (val) => `${Number(val ?? 0)} unid.`,
    },
    {
      key: "id_almacen",
      label: "ID",
      priority: "meta",
      semantic: "code",
    },
  ];

  // ── Acciones de registro ─────────────────────────────────
  const actions: RecordAction[] = [
    {
      id: "edit",
      label: "Editar",
      icon: <Pencil className="h-3.5 w-3.5" />,
      onClick: (item) => openEdit(item as Almacen),
      disabled: !canEdit,
    },
    {
      id: "delete",
      label: "Eliminar",
      icon: <Trash2 className="h-3.5 w-3.5" />,
      onClick: (item) => setDeleting(item as Almacen),
      variant: "destructive",
      disabled: !canDelete,
    },
  ];

  return (
    <>
      <AdaptiveCollection<Almacen>
        title="Almacenes"
        items={almacenes}
        fields={fields}
        actions={actions}
        isLoading={isLoading}
        search={searchTerm}
        searchPlaceholder="Buscar por nombre, ubicación o sucursal…"
        onSearch={setSearchTerm}
        layout="auto"
        getItemId={(a) => a.id_almacen}
        empty={{
          title: "No se encontraron almacenes",
          description: searchTerm ? "Ajusta el término de búsqueda." : "Registra tu primer almacén.",
          action: !searchTerm && canEdit ? { label: "Nuevo almacén", onClick: openCreate } : undefined,
        }}
        globalActions={
          canEdit
            ? [
                {
                  id: "create",
                  label: "Nuevo almacén",
                  icon: <Plus className="h-4 w-4" />,
                  onClick: () => openCreate(),
                },
              ]
            : []
        }
      />

      {isFormOpen && (
        <WarehouseForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} initialData={editing} />
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting)}
        title="¿Eliminar almacén?"
        description={
          <>
            Esta acción es permanente y no se puede deshacer.
            <br />
            <span className="mt-1 inline-block font-medium text-foreground">
              {deleting?.nom_almacen ?? ""}
            </span>
          </>
        }
        confirmLabel="Eliminar"
        variant="danger"
        isPending={deleteMutation.isPending}
      />
    </>
  );
}
