import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Package, Phone, Mail, Search } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import { cn } from "@/lib/utils";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import SupplierForm from "../components/SupplierForm";
import { getProveedores, deleteProveedor } from "../api/suppliers";
import type { Proveedor } from "../types";
import { proveedorNombre, proveedorDocumento, proveedorTipo } from "../types";

type FilterEstado = "todos" | "activo" | "inactivo";

export default function SuppliersPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState<FilterEstado>("todos");
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

  const filtered = proveedores.filter((p) => {
    const term = search.toLowerCase().trim();
    const matchTerm =
      !term ||
      proveedorNombre(p).toLowerCase().includes(term) ||
      proveedorDocumento(p).toLowerCase().includes(term);
    const matchEstado =
      filterEstado === "todos" ||
      (filterEstado === "activo" && p.estado === 1) ||
      (filterEstado === "inactivo" && p.estado === 0);
    return matchTerm && matchEstado;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proveedores</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} de {proveedores.length} proveedores
          </p>
        </div>
        {canEdit && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo proveedor
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o documento…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={filterEstado}
          onValueChange={(v) => setFilterEstado(v as FilterEstado)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="activo">Activos</SelectItem>
            <SelectItem value="inactivo">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-center">Productos</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              {(canEdit || canDelete) && <TableHead className="text-right">Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Cargando proveedores…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  {search || filterEstado !== "todos"
                    ? "Ningún proveedor coincide con los filtros."
                    : "No hay proveedores registrados."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="font-medium">{proveedorNombre(p)}</div>
                    {p.direccion && (
                      <div className="text-xs text-muted-foreground">{p.direccion}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-sm">
                      {proveedorTipo(p) === "juridico" ? "RUC" : "DNI"}: {proveedorDocumento(p)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {p.telefono ? (
                      <span className="flex items-center gap-1.5 text-sm">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        {p.telefono}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {p.email ? (
                      <span className="flex items-center gap-1.5 text-sm">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        {p.email}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="flex items-center justify-center gap-1 text-sm">
                      <Package className="h-3.5 w-3.5 text-muted-foreground" />
                      {p.productos_count ?? 0}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={p.estado === 1 ? "default" : "secondary"}
                      className={cn(
                        p.estado === 1
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                          : "bg-rose-100 text-rose-700 hover:bg-rose-100"
                      )}
                    >
                      {p.estado === 1 ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  {(canEdit || canDelete) && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(p)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleting(p)}
                            title="Eliminar"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* CRUD Modal */}
      {isFormOpen && (
        <SupplierForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} initialData={editing} />
      )}

      {/* Confirm delete */}
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
