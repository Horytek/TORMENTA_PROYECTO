import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useQueryState, parseAsString } from "nuqs";
import { Plus, Search, Pencil, Trash2, ShieldCheck, Lock, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { useUserStore } from "@/store/useUserStore";
import { cn } from "@/lib/utils";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { IconAction } from "@/components/shared/IconAction";
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

  const capabilities = useUserStore((s) => s.capabilities);
  const user = useUserStore((s) => s.user);
  const can = (perm: string) =>
    user?.roleId === 10 || capabilities.has(perm) || capabilities.has("*");
  const canEdit = can("configuracion/roles.edit");
  const canDelete = can("configuracion/roles.delete");

  const { data: roles = [], isLoading } = useQuery<Rol[]>({
    queryKey: ["roles"],
    queryFn: getRoles,
  });

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return roles;
    return roles.filter((r) => r.nom_rol.toLowerCase().includes(term));
  }, [roles, searchTerm]);

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

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 border-b border-border pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Roles y permisos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="num font-medium text-foreground">{roles.length}</span> roles definidos
          </p>
        </div>
        <Button onClick={openCreate} disabled={!canEdit} className="gap-2 self-start md:self-auto">
          <Plus className="h-4 w-4" />
          Nuevo rol
        </Button>
      </div>

      {/* Búsqueda */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar rol…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabla */}
      <div className="rounded-lg border border-border bg-card">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 w-full animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
            <ShieldCheck className="h-10 w-10 text-muted-foreground/40" />
            <h3 className="text-base font-semibold text-foreground">No se encontraron roles</h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm ? "Ajusta el término de búsqueda." : "Crea el primer rol."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Rol</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="pr-4 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => {
                const isActive = Number(r.estado_rol) === 1;
                const reserved = RESERVED_ROLES.includes(r.id_rol);
                return (
                  <TableRow key={r.id_rol}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand/10 text-brand ring-1 ring-brand/20">
                          <ShieldCheck className="h-4 w-4" />
                        </span>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium capitalize text-foreground">{r.nom_rol}</p>
                          {reserved && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                              <Lock className="h-2.5 w-2.5" />
                              Sistema
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={isActive ? "success" : "secondary"} className="gap-1.5">
                        <span className={cn("h-1.5 w-1.5 rounded-full", isActive ? "bg-emerald-600" : "bg-muted-foreground")} />
                        {isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5"
                          onClick={() => setPermsRole(r)}
                          disabled={!canEdit || reserved}
                        >
                          <SlidersHorizontal className="h-3.5 w-3.5" />
                          Permisos
                        </Button>
                        <IconAction
                          label={reserved ? "Rol del sistema" : "Editar"}
                          onClick={() => openEdit(r)}
                          disabled={!canEdit || reserved}
                        >
                          <Pencil className="h-4 w-4" />
                        </IconAction>
                        <IconAction
                          label={reserved ? "Rol del sistema" : "Eliminar"}
                          danger
                          onClick={() => setDeleting(r)}
                          disabled={!canDelete || reserved}
                        >
                          <Trash2 className="h-4 w-4" />
                        </IconAction>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

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
