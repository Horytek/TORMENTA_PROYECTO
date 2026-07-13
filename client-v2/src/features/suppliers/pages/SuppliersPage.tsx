import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Phone, Mail } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";

import { AdaptiveCollection } from "@/components/shared/AdaptiveCollection/AdaptiveCollection";
import type { FieldDef, RecordAction } from "@/components/shared/AdaptiveCollection/types";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import SupplierForm from "../components/SupplierForm";
import { getProveedores, deleteProveedor } from "../api/suppliers";
import type { Proveedor } from "../types";
import { proveedorNombre, proveedorDocumento, proveedorTipo } from "../types";

export default function SuppliersPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
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
    queryKey: ["suppliers"],
    queryFn: getProveedores,
  });

  const deleteMutation = useMutation({
    mutationFn: (p: Proveedor) => deleteProveedor(p.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setDeleting(null);
    },
  });

  const openCreate = () => { setEditing(null); setIsFormOpen(true); };
  const openEdit = (p: Proveedor) => { setEditing(p); setIsFormOpen(true); };

  // ── Fields para AdaptiveCard ──────────────────────────────
  const fields: FieldDef<Proveedor>[] = [
    {
      key: "nombre",
      label: "Nombre",
      priority: "primary",
      semantic: "title",
      render: (_v, item) => proveedorNombre(item),
    },
    {
      key: "documento",
      label: "Documento",
      priority: "secondary",
      semantic: "subtitle",
      render: (_v, item) => {
        const tipo = proveedorTipo(item) === "juridico" ? "RUC" : "DNI";
        const num = proveedorDocumento(item);
        return num ? `${tipo}: ${num}` : null;
      },
    },
    {
      key: "telefono",
      label: "Teléfono",
      priority: "secondary",
      semantic: "icon-text",
      render: (v) => {
        if (!v) return null;
        return (
          <span className="flex items-center gap-1.5 min-w-0">
            <Phone className="h-3 w-3 shrink-0 text-muted-foreground/70" />
            <span className="truncate">{String(v)}</span>
          </span>
        );
      },
    },
    {
      key: "email",
      label: "Email",
      priority: "secondary",
      semantic: "icon-text",
      render: (v) => {
        if (!v) return null;
        return (
          <span className="flex items-center gap-1.5 min-w-0">
            <Mail className="h-3 w-3 shrink-0 text-muted-foreground/70" />
            <span className="truncate">{String(v)}</span>
          </span>
        );
      },
    },
    {
      key: "productos_count",
      label: "Productos",
      priority: "secondary",
      semantic: "number",
      render: (v) => (v != null ? String(v) : "0"),
    },
    {
      key: "estado",
      label: "Estado",
      priority: "secondary",
      semantic: "status-dot",
      format: (v) => (Number(v) === 1 ? "Activo" : "Inactivo"),
    },
    {
      key: "direccion",
      label: "Dirección",
      priority: "secondary",
      semantic: "text",
    },
    {
      key: "id",
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
      onClick: (item) => openEdit(item as Proveedor),
      disabled: !canEdit,
    },
    {
      id: "delete",
      label: "Eliminar",
      icon: <Trash2 className="h-3.5 w-3.5" />,
      onClick: (item) => setDeleting(item as Proveedor),
      variant: "destructive",
      disabled: !canDelete,
    },
  ];

  return (
    <>
      <AdaptiveCollection<Proveedor>
        title="Proveedores"
        items={proveedores}
        fields={fields}
        actions={actions}
        isLoading={isLoading}
        search={search}
        searchPlaceholder="Buscar por nombre o documento…"
        onSearch={setSearch}
        layout="card"
        getItemId={(p) => p.id}
        empty={{
          title: "No se encontraron proveedores",
          description: search ? "Ajusta el término de búsqueda." : "Registra tu primer proveedor.",
          action: !search && canEdit ? { label: "Nuevo proveedor", onClick: openCreate } : undefined,
        }}
        globalActions={
          canEdit
            ? [
                {
                  id: "create",
                  label: "Nuevo proveedor",
                  icon: <Plus className="h-4 w-4" />,
                  onClick: () => openCreate(),
                },
              ]
            : []
        }
      />

      {isFormOpen && (
        <SupplierForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} initialData={editing} />
      )}

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
    </>
  );
}
