import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useQueryState, parseAsString } from "nuqs";
import { Plus, Pencil, Trash2, ShieldCheck, Lock, SlidersHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { usePermissions } from "@/hooks/usePermissions";
import { AdaptiveCollection } from "@/components/shared/AdaptiveCollection/AdaptiveCollection";
import type { FieldDef, RecordAction } from "@/components/shared/AdaptiveCollection/types";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import RoleForm from "../components/RoleForm";
import RolePermissionsDialog from "../components/RolePermissionsDialog";
import { getRoles, deleteRol } from "../api/roles";
import type { Rol } from "../types";
import { RESERVED_ROLES } from "../types";

export default function RolesPage() {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useQueryState("q", parseAsString.withDefault(""));
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Rol | null>(null);
  const [deleting, setDeleting] = useState<Rol | null>(null);
  const [permsRole, setPermsRole] = useState<Rol | null>(null);

  const { can } = usePermissions();
  const canEdit = can("configuracion/roles.edit");
  const canDelete = can("configuracion/roles.delete");

  const { data: roles = [], isLoading } = useQuery<Rol[]>({
    queryKey: ["roles"],
    queryFn: getRoles,
  });

  const deleteMutation = useMutation({
    mutationFn: (r: Rol) => deleteRol(r.id_rol),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setDeleting(null);
    },
  });

  const openCreate = () => {
    setEditing(null);
    setIsFormOpen(true);
  };
  const openEdit = (r: Rol) => {
    setEditing(r);
    setIsFormOpen(true);
  };

  // ── Field definitions ────────────────────────────────────
  const fields: FieldDef<Rol>[] = [
    {
      key: "nom_rol",
      label: "Rol",
      priority: "primary",
      semantic: "title",
      render: (val, item) => {
        const reserved = RESERVED_ROLES.includes(item.id_rol);
        return (
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand/10 text-brand ring-1 ring-brand/20">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div className="flex items-center gap-2">
              <span className="capitalize font-semibold text-foreground text-sm">{String(val)}</span>
              {reserved && (
                <Badge variant="outline" className="text-[10px] gap-1 py-0.5 px-2 font-normal text-muted-foreground bg-muted/50 border-border">
                  <Lock className="h-2.5 w-2.5" />
                  Sistema
                </Badge>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "estado_rol",
      label: "Estado",
      priority: "secondary",
      semantic: "badge",
      format: (val) => (Number(val) === 1 ? "Activo" : "Inactivo"),
    },
    {
      key: "id_rol",
      label: "ID",
      priority: "meta",
      semantic: "code",
    },
  ];

  // ── Record Actions ──────────────────────────────────────
  const actions: RecordAction[] = [
    {
      id: "perms",
      label: "Permisos",
      icon: <SlidersHorizontal className="h-3.5 w-3.5" />,
      onClick: (item) => setPermsRole(item as Rol),
      persistent: true,
      disabled: (item) => !canEdit || RESERVED_ROLES.includes((item as Rol).id_rol),
    },
    {
      id: "edit",
      label: "Editar",
      icon: <Pencil className="h-3.5 w-3.5" />,
      onClick: (item) => openEdit(item as Rol),
      disabled: (item) => !canEdit || RESERVED_ROLES.includes((item as Rol).id_rol),
    },
    {
      id: "delete",
      label: "Eliminar",
      icon: <Trash2 className="h-3.5 w-3.5" />,
      onClick: (item) => setDeleting(item as Rol),
      variant: "destructive",
      disabled: (item) => !canDelete || RESERVED_ROLES.includes((item as Rol).id_rol),
    },
  ];

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <AdaptiveCollection<Rol>
        title="Roles y permisos"
        items={roles}
        fields={fields}
        actions={actions}
        layout="auto"
        isLoading={isLoading}
        search={searchTerm}
        searchPlaceholder="Buscar rol…"
        onSearch={setSearchTerm}
        empty={{
          title: "No se encontraron roles",
          description: searchTerm ? "Ajusta el término de búsqueda." : "Crea el primer rol.",
        }}
        getItemId={(r) => r.id_rol}
        globalActions={canEdit ? [{
          id: "create",
          label: "Nuevo rol",
          icon: <Plus className="h-4 w-4" />,
          onClick: openCreate,
        }] : undefined}
      />

      {isFormOpen && (
        <RoleForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} initialData={editing} />
      )}

      {permsRole && (
        <RolePermissionsDialog role={permsRole} open onClose={() => setPermsRole(null)} />
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting)}
        title="¿Eliminar rol?"
        description={
          <>
            Los usuarios con este rol podrían perder acceso. Esta acción es permanente.
            <br />
            <span className="mt-1 inline-block font-medium capitalize text-foreground">
              {deleting?.nom_rol ?? ""}
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
