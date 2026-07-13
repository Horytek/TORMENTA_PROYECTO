import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useQueryState, parseAsString } from "nuqs";
import { Plus, Search, Pencil, Trash2, Warehouse, MapPin, Building2 } from "lucide-react";

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
import WarehouseForm from "../components/WarehouseForm";
import { getAlmacenes, deleteAlmacen } from "../api/warehouses";
import type { Almacen } from "../types";

export default function WarehousesPage() {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useQueryState("q", parseAsString.withDefault(""));
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Almacen | null>(null);
  const [deleting, setDeleting] = useState<Almacen | null>(null);

  const capabilities = useUserStore((s) => s.capabilities);
  const user = useUserStore((s) => s.user);
  const can = (perm: string) =>
    user?.roleId === 10 || capabilities.has(perm) || capabilities.has("*");
  const canEdit = can("almaceng.edit");
  const canDelete = can("almaceng.delete");

  const { data: almacenes = [], isLoading } = useQuery<Almacen[]>({
    queryKey: ["almacenes"],
    queryFn: getAlmacenes,
  });

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return almacenes;
    return almacenes.filter(
      (a) =>
        a.nom_almacen.toLowerCase().includes(term) ||
        (a.ubicacion ?? "").toLowerCase().includes(term) ||
        (a.nombre_sucursal ?? "").toLowerCase().includes(term)
    );
  }, [almacenes, searchTerm]);

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

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 border-b border-border pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Almacenes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="num font-medium text-foreground">{almacenes.length}</span> almacenes registrados
          </p>
        </div>
        <Button onClick={openCreate} disabled={!canEdit} className="gap-2 self-start md:self-auto">
          <Plus className="h-4 w-4" />
          Nuevo almacén
        </Button>
      </div>

      {/* Búsqueda */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, ubicación o sucursal…"
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
            <Warehouse className="h-10 w-10 text-muted-foreground/40" />
            <h3 className="text-base font-semibold text-foreground">No se encontraron almacenes</h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm ? "Ajusta el término de búsqueda." : "Registra tu primer almacén."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Almacén</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Sucursal</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="pr-4 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a) => {
                const isActive = Number(a.estado_almacen) === 1;
                return (
                  <TableRow key={a.id_almacen}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand/10 text-brand ring-1 ring-brand/20">
                          <Warehouse className="h-4 w-4" />
                        </span>
                        <p className="truncate text-sm font-medium text-foreground">{a.nom_almacen}</p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[14rem] truncate text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        {a.ubicacion || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {a.nombre_sucursal ? (
                        <span className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 shrink-0" />
                          {a.nombre_sucursal}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60">Sin asignar</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={isActive ? "success" : "destructive"} className="gap-1.5">
                        <span className={cn("h-1.5 w-1.5 rounded-full", isActive ? "bg-emerald-600" : "bg-red-600")} />
                        {isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-4">
                      <div className="flex items-center justify-end gap-1">
                        <IconAction label="Editar" onClick={() => openEdit(a)} disabled={!canEdit}>
                          <Pencil className="h-4 w-4" />
                        </IconAction>
                        <IconAction label="Eliminar" danger onClick={() => setDeleting(a)} disabled={!canDelete}>
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
    </div>
  );
}
