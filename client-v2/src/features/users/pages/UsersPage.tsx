import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useQueryState, parseAsString } from "nuqs";
import { Plus, Search, Pencil, Trash2, Users as UsersIcon, ShieldCheck } from "lucide-react";

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
import UserForm from "../components/UserForm";
import { getUsuarios, deleteUsuario } from "../api/users";
import type { Usuario } from "../types";

export default function UsersPage() {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useQueryState("q", parseAsString.withDefault(""));
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [deleting, setDeleting] = useState<Usuario | null>(null);

  const capabilities = useUserStore((s) => s.capabilities);
  const currentUser = useUserStore((s) => s.user);
  const can = (perm: string) =>
    currentUser?.roleId === 10 || capabilities.has(perm) || capabilities.has("*");
  const canEdit = can("configuracion/usuarios.edit");
  const canDelete = can("configuracion/usuarios.delete");

  const { data: usuarios = [], isLoading } = useQuery<Usuario[]>({
    queryKey: ["usuarios"],
    queryFn: getUsuarios,
  });

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return usuarios;
    return usuarios.filter(
      (u) =>
        u.usua.toLowerCase().includes(term) ||
        (u.nom_rol ?? "").toLowerCase().includes(term)
    );
  }, [usuarios, searchTerm]);

  const deleteMutation = useMutation({
    mutationFn: (u: Usuario) => deleteUsuario(u.id_usuario),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      setDeleting(null);
    },
  });

  const openCreate = () => {
    setEditing(null);
    setIsFormOpen(true);
  };
  const openEdit = (u: Usuario) => {
    setEditing(u);
    setIsFormOpen(true);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 border-b border-border pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Usuarios</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="num font-medium text-foreground">{usuarios.length}</span> cuentas de acceso
          </p>
        </div>
        <Button onClick={openCreate} disabled={!canEdit} className="gap-2 self-start md:self-auto">
          <Plus className="h-4 w-4" />
          Nuevo usuario
        </Button>
      </div>

      {/* Búsqueda */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por usuario o rol…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabla */}
      <div className="rounded-lg border border-border bg-card">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 w-full animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
            <UsersIcon className="h-10 w-10 text-muted-foreground/40" />
            <h3 className="text-base font-semibold text-foreground">No se encontraron usuarios</h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm ? "Ajusta el término de búsqueda." : "Crea la primera cuenta de acceso."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="pr-4 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => {
                const isActive = Number(u.estado_usuario) === 1;
                const isSelf = currentUser?.username === u.usua;
                return (
                  <TableRow key={u.id_usuario}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <span className="num flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand/10 text-xs font-bold uppercase text-brand ring-1 ring-brand/20">
                          {u.usua.slice(0, 2)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {u.usua}
                            {isSelf && <span className="ml-2 text-[10px] font-normal text-muted-foreground">(tú)</span>}
                          </p>
                          {u.plan_pago_1 && (
                            <p className="num text-xs text-muted-foreground">{u.plan_pago_1}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1 font-medium">
                        <ShieldCheck className="h-3 w-3" />
                        {u.nom_rol || `Rol ${u.id_rol}`}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={isActive ? "success" : "destructive"} className="gap-1.5">
                        <span className={cn("h-1.5 w-1.5 rounded-full", isActive ? "bg-emerald-600" : "bg-red-600")} />
                        {isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-4">
                      <div className="flex items-center justify-end gap-1">
                        <IconAction label="Editar" onClick={() => openEdit(u)} disabled={!canEdit}>
                          <Pencil className="h-4 w-4" />
                        </IconAction>
                        <IconAction
                          label={isSelf ? "No puedes eliminarte" : "Eliminar"}
                          danger
                          onClick={() => setDeleting(u)}
                          disabled={!canDelete || isSelf}
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
        <UserForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} initialData={editing} />
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting)}
        title="¿Eliminar usuario?"
        description={
          <>
            Se eliminará la cuenta de acceso de forma permanente.
            <br />
            <span className="num mt-1 inline-block font-medium text-foreground">
              {deleting?.usua ?? ""}
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
