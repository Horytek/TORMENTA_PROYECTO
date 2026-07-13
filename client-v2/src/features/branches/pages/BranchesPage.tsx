import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useQueryState, parseAsString } from "nuqs";
import { Plus, Pencil, Trash2, UserRound } from "lucide-react";

import { useUserStore } from "@/store/useUserStore";

import { AdaptiveCollection } from "@/components/shared/AdaptiveCollection/AdaptiveCollection";
import type { FieldDef, RecordAction } from "@/components/shared/AdaptiveCollection/types";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import BranchForm from "../components/BranchForm";
import { getSucursales, deleteSucursal } from "../api/branches";
import type { Sucursal } from "../types";
import { sucursalVendedor } from "../types";

export default function BranchesPage() {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useQueryState("q", parseAsString.withDefault(""));
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Sucursal | null>(null);
  const [deleting, setDeleting] = useState<Sucursal | null>(null);

  const capabilities = useUserStore((s) => s.capabilities);
  const user = useUserStore((s) => s.user);
  const can = (perm: string) =>
    user?.roleId === 10 || capabilities.has(perm) || capabilities.has("*");
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
      id: "edit",
      label: "Editar",
      icon: <Pencil className="h-3.5 w-3.5" />,
      onClick: (item) => openEdit(item as Sucursal),
      disabled: !canEdit,
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
        layout="card"
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
        onClose={() => setDeleting(null)}
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
      />
    </>
  );
}
