import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useQueryState, parseAsString } from "nuqs";
import { Plus, Pencil, Trash2, Phone, Mail } from "lucide-react";

import { AdaptiveCollection } from "@/components/shared/AdaptiveCollection";
import type { FieldDef, RecordAction } from "@/components/shared/AdaptiveCollection";
import { useUserStore } from "@/store/useUserStore";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import ProveedorForm from "../components/ProveedorForm";
import { getProveedores, deleteProveedor } from "../api/proveedores";
import type { Proveedor } from "../types";
import { proveedorNombre, proveedorDocumento, proveedorTipo } from "../types";

export default function ProveedoresPage() {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useQueryState("q", parseAsString.withDefault(""));
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Proveedor | null>(null);
  const [deleting, setDeleting] = useState<Proveedor | null>(null);

  const capabilities = useUserStore((s) => s.capabilities);
  const user = useUserStore((s) => s.user);
  const can = (perm: string) =>
    user?.roleId === 10 || capabilities.has(perm) || capabilities.has("*");
  const canEdit = can("proveedores.edit");
  const canDelete = can("proveedores.delete");

  const { data: proveedores = [], isLoading } = useQuery<Proveedor[]>({
    queryKey: ["proveedores"],
    queryFn: getProveedores,
  });

  const fields: FieldDef<Proveedor>[] = [
    {
      key: "nombres",
      priority: "primary",
      semantic: "title",
      label: "Proveedor",
      render: (_, p) => proveedorNombre(p),
    },
    {
      key: "direccion",
      priority: "secondary",
      semantic: "subtitle",
      label: "Ubicación",
      format: (v) => (v as string) || "—",
    },
    {
      key: "estado",
      priority: "secondary",
      semantic: "badge",
      label: "Estado",
      format: (v) => Number(v) === 1 ? "Activo" : "Inactivo",
    },
    {
      key: "ruc",
      priority: "meta",
      semantic: "code",
      label: "Documento",
      render: (_, p) => `${proveedorTipo(p) === "juridico" ? "RUC" : "DNI"}: ${proveedorDocumento(p)}`,
    },
    {
      key: "telefono",
      priority: "secondary",
      semantic: "icon-text",
      label: "Teléfono",
      render: (v) => v ? (
        <span className="flex items-center gap-1.5 text-foreground">
          <Phone className="h-3 w-3 text-muted-foreground" />
          {String(v)}
        </span>
      ) : null,
    },
    {
      key: "email",
      priority: "secondary",
      semantic: "icon-text",
      label: "Email",
      render: (v) => v ? (
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Mail className="h-3 w-3 text-muted-foreground" />
          {String(v)}
        </span>
      ) : null,
    },
  ];

  const getRhythm = (p: Proveedor) => ({
    type: "dot" as const,
    color: Number(p.estado) === 1 ? "emerald" as const : "rose" as const,
  });

  const actions: RecordAction[] = [
    {
      id: "edit",
      label: "Editar",
      icon: <Pencil className="h-4 w-4" />,
      onClick: (item) => openEdit(item as Proveedor),
      disabled: !canEdit,
    },
    {
      id: "delete",
      label: "Eliminar",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (item) => setDeleting(item as Proveedor),
      variant: "destructive",
      disabled: !canDelete,
    },
  ];

  const deleteMutation = useMutation({
    mutationFn: (p: Proveedor) => deleteProveedor(p.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proveedores"] });
      setDeleting(null);
    },
  });

  const openCreate = () => {
    setEditing(null);
    setIsFormOpen(true);
  };
  const openEdit = (p: Proveedor) => {
    setEditing(p);
    setIsFormOpen(true);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      <AdaptiveCollection<Proveedor>
        title="Proveedores"
        items={proveedores}
        fields={fields}
        actions={actions}
        layout="card"
        isLoading={isLoading}
        search={searchTerm}
        searchPlaceholder="Buscar por nombre o documento…"
        onSearch={setSearchTerm}
        empty={{
          title: "No se encontraron proveedores",
          description: searchTerm
            ? `Ningún proveedor coincide con "${searchTerm}"`
            : "Registra tu primer proveedor.",
          action: canEdit ? { label: "Nuevo proveedor", onClick: openCreate } : undefined,
        }}
        getItemId={(p: Proveedor) => p.id}
        getRhythm={getRhythm}
        globalActions={
          canEdit
            ? [{ id: "create", label: "Nuevo proveedor", icon: <Plus className="h-4 w-4" />, onClick: () => openCreate() }]
            : []
        }
      />

      {/* Alta / edición */}
      {isFormOpen && (
        <ProveedorForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} initialData={editing} />
      )}

      {/* Confirmar eliminación */}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting)}
        title="¿Eliminar proveedor?"
        description={
          <>
            Esta acción es permanente y no se puede deshacer.
            <br />
            <span className="mt-1 inline-block font-medium text-foreground">
              {deleting ? proveedorNombre(deleting) : ""}
            </span>
          </>
        }
        confirmLabel="Eliminar"
        variant="danger"
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
