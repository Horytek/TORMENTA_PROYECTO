import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useQueryState, parseAsString } from "nuqs";
import { Plus, Search, Pencil, Trash2, Building2, MapPin, UserRound } from "lucide-react";

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

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return sucursales;
    return sucursales.filter(
      (s) =>
        s.nombre_sucursal.toLowerCase().includes(term) ||
        (s.ubicacion ?? "").toLowerCase().includes(term) ||
        sucursalVendedor(s).toLowerCase().includes(term)
    );
  }, [sucursales, searchTerm]);

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

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 border-b border-border pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Sucursales</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="num font-medium text-foreground">{sucursales.length}</span> sucursales registradas
          </p>
        </div>
        <Button onClick={openCreate} disabled={!canEdit} className="gap-2 self-start md:self-auto">
          <Plus className="h-4 w-4" />
          Nueva sucursal
        </Button>
      </div>

      {/* Búsqueda */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, ubicación o vendedor…"
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
            <Building2 className="h-10 w-10 text-muted-foreground/40" />
            <h3 className="text-base font-semibold text-foreground">No se encontraron sucursales</h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm ? "Ajusta el término de búsqueda." : "Registra tu primera sucursal."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Sucursal</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="pr-4 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => {
                const isActive = Number(s.estado_sucursal) === 1;
                return (
                  <TableRow key={s.id_sucursal}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand/10 text-brand ring-1 ring-brand/20">
                          <Building2 className="h-4 w-4" />
                        </span>
                        <p className="truncate text-sm font-medium text-foreground">{s.nombre_sucursal}</p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[16rem] truncate text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        {s.ubicacion || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <UserRound className="h-3.5 w-3.5 shrink-0" />
                        {sucursalVendedor(s)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={isActive ? "success" : "destructive"} className="gap-1.5">
                        <span className={cn("h-1.5 w-1.5 rounded-full", isActive ? "bg-emerald-600" : "bg-red-600")} />
                        {isActive ? "Activa" : "Inactiva"}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-4">
                      <div className="flex items-center justify-end gap-1">
                        <IconAction label="Editar" onClick={() => openEdit(s)} disabled={!canEdit}>
                          <Pencil className="h-4 w-4" />
                        </IconAction>
                        <IconAction label="Eliminar" danger onClick={() => setDeleting(s)} disabled={!canDelete}>
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
    </div>
  );
}
