import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useQueryState, parseAsString } from "nuqs";
import { Plus, Search, Pencil, Trash2, Truck, Phone, Mail } from "lucide-react";

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

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return proveedores;
    return proveedores.filter(
      (p) =>
        proveedorNombre(p).toLowerCase().includes(term) ||
        proveedorDocumento(p).toLowerCase().includes(term)
    );
  }, [proveedores, searchTerm]);

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
      {/* Encabezado */}
      <div className="flex flex-col gap-4 border-b border-border pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Proveedores</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="num font-medium text-foreground">{proveedores.length}</span> proveedores registrados
          </p>
        </div>
        <Button onClick={openCreate} disabled={!canEdit} className="gap-2 self-start md:self-auto">
          <Plus className="h-4 w-4" />
          Nuevo proveedor
        </Button>
      </div>

      {/* Búsqueda */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o documento…"
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
            <Truck className="h-10 w-10 text-muted-foreground/40" />
            <h3 className="text-base font-semibold text-foreground">No se encontraron proveedores</h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm ? "Ajusta el término de búsqueda." : "Registra tu primer proveedor."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Proveedor</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="pr-4 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => {
                const isActive = Number(p.estado) === 1;
                const nombre = proveedorNombre(p);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <span className="num flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand/10 text-xs font-bold uppercase text-brand ring-1 ring-brand/20">
                          {nombre.slice(0, 2)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{nombre}</p>
                          <p className="num text-xs text-muted-foreground">
                            {proveedorTipo(p) === "juridico" ? "RUC" : "DNI"} · {proveedorDocumento(p)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5 text-xs">
                        {p.telefono ? (
                          <span className="num flex items-center gap-1.5 text-foreground">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {p.telefono}
                          </span>
                        ) : null}
                        {p.email ? (
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{p.email}</span>
                          </span>
                        ) : null}
                        {!p.telefono && !p.email && <span className="text-muted-foreground">—</span>}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[14rem] truncate text-sm text-muted-foreground">
                      {p.direccion || "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={isActive ? "success" : "destructive"} className="gap-1.5">
                        <span className={cn("h-1.5 w-1.5 rounded-full", isActive ? "bg-emerald-600" : "bg-red-600")} />
                        {isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-4">
                      <div className="flex items-center justify-end gap-1">
                        <IconAction label="Editar" onClick={() => openEdit(p)} disabled={!canEdit}>
                          <Pencil className="h-4 w-4" />
                        </IconAction>
                        <IconAction label="Eliminar" danger onClick={() => setDeleting(p)} disabled={!canDelete}>
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
