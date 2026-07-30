import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Phone, Mail, Receipt } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";

import { cn } from "@/lib/utils";
import { AdaptiveCollection } from "@/components/shared/AdaptiveCollection/AdaptiveCollection";
import type { FieldDef, RecordAction } from "@/components/shared/AdaptiveCollection/types";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import SupplierForm from "../components/SupplierForm";
import { SupplierAccountsDrawer } from "../components/SupplierAccountsDrawer";
import { getProveedores, deleteProveedor } from "../api/suppliers";
import type { Proveedor } from "../types";
import { proveedorNombre, proveedorDocumento, proveedorTipo } from "../types";

export default function SuppliersPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Proveedor | null>(null);
  const [deleting, setDeleting] = useState<Proveedor | null>(null);
  const [viewingAccounts, setViewingAccounts] = useState<Proveedor | null>(null);

  const { can } = usePermissions();
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
      // "destinatario" es el campo real que devuelve el backend (nombre
      // compuesto ya armado); "nombre" no existe en el objeto y dejaba la
      // búsqueda por nombre siempre sin resultados.
      key: "destinatario",
      label: "Nombre",
      priority: "primary",
      semantic: "title",
      render: (_v, item) => proveedorNombre(item),
    },
    {
      key: "direccion",
      label: "Dirección",
      priority: "secondary",
      semantic: "subtitle",
      format: (v) => (v as string) || "—",
    },
    {
      // Mismo motivo que arriba: "contacto" no existe en el objeto real
      // (son "telefono"/"email" por separado) — se usa "telefono" para que
      // al menos ese dato sea buscable; el render sigue mostrando ambos.
      key: "telefono",
      label: "Teléfono / Email",
      priority: "secondary",
      semantic: "chip",
      render: (_v, item) => {
        const hasPhone = item.telefono && item.telefono.trim() !== "" && item.telefono !== "-";
        const hasEmail = item.email && item.email.trim() !== "" && item.email !== "-";
        if (!hasPhone && !hasEmail) {
          return null;
        }
        return (
          <div className="flex flex-col justify-center gap-0.5 text-xs text-muted-foreground">
            {hasPhone && (
              <span className="flex items-center gap-1.5 truncate">
                <Phone className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                <span className="truncate">{item.telefono}</span>
              </span>
            )}
            {hasEmail && (
              <span className="flex items-center gap-1.5 truncate">
                <Mail className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                <span className="truncate">{item.email}</span>
              </span>
            )}
          </div>
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
      semantic: "badge",
      format: (v) => (Number(v) === 1 ? "Activo" : "Inactivo"),
    },
    {
      key: "documento",
      label: "Documento",
      priority: "meta",
      semantic: "code",
      render: (_v, item) => {
        const num = proveedorDocumento(item);
        if (!num || num === "Sin documento") return null;
        const isRuc = num.length === 11 || proveedorTipo(item) === "juridico";
        const tipo = isRuc ? "RUC" : "DNI";
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-card text-xs font-mono font-medium border border-border/80 text-foreground/90 shadow-2xs">
            <span className={cn(
              "text-[9px] font-sans font-bold uppercase tracking-wider px-1 py-0.5 rounded leading-none",
              isRuc
                ? "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/20"
                : "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-500/20"
            )}>
              {tipo}
            </span>
            <span>{num}</span>
          </span>
        );
      },
    },
    {
      key: "id",
      priority: "hidden",
    },
  ];

  // ── Acciones de registro ─────────────────────────────────
  const actions: RecordAction[] = [
    {
      id: "cuentas",
      label: "Cuentas por pagar",
      icon: <Receipt className="h-3.5 w-3.5" />,
      onClick: (item) => setViewingAccounts(item as Proveedor),
    },
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
        exportFileName="proveedores"
        layout="auto"
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

      <SupplierAccountsDrawer
        proveedor={viewingAccounts}
        isOpen={!!viewingAccounts}
        onClose={() => setViewingAccounts(null)}
      />
    </>
  );
}
