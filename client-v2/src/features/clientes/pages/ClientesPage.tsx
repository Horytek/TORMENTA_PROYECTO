import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useQueryState, parseAsString } from "nuqs";
import { Plus, Search, Pencil, Trash2, Ban, RotateCcw, Users } from "lucide-react";

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
import ClientForm from "../components/ClientForm";
import { getClientes, deleteCliente, deactivateCliente, updateCliente } from "../api/clientes";
import type { Cliente } from "../types";
import { clienteNombre, clienteDocumento, clienteTipo } from "../types";

type ConfirmAction = "delete" | "deactivate" | "reactivate";

const CONFIRM_COPY: Record<ConfirmAction, { title: string; desc: string; cta: string; danger?: boolean }> = {
  delete: {
    title: "¿Eliminar cliente?",
    desc: "Esta acción es permanente y no se puede deshacer.",
    cta: "Eliminar",
    danger: true,
  },
  deactivate: {
    title: "¿Dar de baja al cliente?",
    desc: "El cliente quedará inactivo, pero podrás reactivarlo después.",
    cta: "Dar de baja",
  },
  reactivate: {
    title: "¿Reactivar cliente?",
    desc: "El cliente volverá a estar activo.",
    cta: "Reactivar",
  },
};

export default function ClientesPage() {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useQueryState("q", parseAsString.withDefault(""));
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [confirm, setConfirm] = useState<{ action: ConfirmAction; cliente: Cliente } | null>(null);

  const capabilities = useUserStore((s) => s.capabilities);
  const user = useUserStore((s) => s.user);
  const can = (perm: string) =>
    user?.roleId === 10 || capabilities.has(perm) || capabilities.has("*");
  const canEdit = can("clientes.edit");
  const canDelete = can("clientes.delete");

  const { data: clientes = [], isLoading } = useQuery<Cliente[]>({
    queryKey: ["clientes"],
    queryFn: getClientes,
  });

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return clientes;
    return clientes.filter(
      (c) =>
        clienteNombre(c).toLowerCase().includes(term) ||
        clienteDocumento(c).toLowerCase().includes(term)
    );
  }, [clientes, searchTerm]);

  const confirmMutation = useMutation({
    mutationFn: async ({ action, cliente }: { action: ConfirmAction; cliente: Cliente }) => {
      if (action === "delete") return deleteCliente(cliente.id);
      if (action === "deactivate") return deactivateCliente(cliente.id);
      return updateCliente({
        id_cliente: cliente.id,
        dni: cliente.dni,
        ruc: cliente.ruc,
        nombres: cliente.nombres,
        apellidos: cliente.apellidos,
        razon_social: cliente.razon_social,
        direccion: cliente.direccion,
        estado: 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      setConfirm(null);
    },
  });

  const openCreate = () => {
    setEditing(null);
    setIsFormOpen(true);
  };
  const openEdit = (c: Cliente) => {
    setEditing(c);
    setIsFormOpen(true);
  };

  const copy = confirm ? CONFIRM_COPY[confirm.action] : null;

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 border-b border-border pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Clientes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="num font-medium text-foreground">{clientes.length}</span> clientes registrados
          </p>
        </div>
        <Button onClick={openCreate} disabled={!canEdit} className="gap-2 self-start md:self-auto">
          <Plus className="h-4 w-4" />
          Nuevo cliente
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
            <Users className="h-10 w-10 text-muted-foreground/40" />
            <h3 className="text-base font-semibold text-foreground">No se encontraron clientes</h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm ? "Ajusta el término de búsqueda." : "Registra tu primer cliente."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Cliente</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="pr-4 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => {
                const isActive = Number(c.estado) === 1;
                const nombre = clienteNombre(c);
                return (
                  <TableRow key={c.id}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <span className="num flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand/10 text-xs font-bold uppercase text-brand ring-1 ring-brand/20">
                          {nombre.slice(0, 2)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{nombre}</p>
                          <p className="num text-xs text-muted-foreground">
                            {clienteTipo(c) === "juridico" ? "RUC" : "DNI"} · {clienteDocumento(c)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[16rem] truncate text-sm text-muted-foreground">
                      {c.direccion || "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={isActive ? "success" : "destructive"} className="gap-1.5">
                        <span className={cn("h-1.5 w-1.5 rounded-full", isActive ? "bg-emerald-600" : "bg-red-600")} />
                        {isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-4">
                      <div className="flex items-center justify-end gap-1">
                        <IconAction label="Editar" onClick={() => openEdit(c)} disabled={!canEdit}>
                          <Pencil className="h-4 w-4" />
                        </IconAction>
                        {isActive ? (
                          <IconAction
                            label="Dar de baja"
                            onClick={() => setConfirm({ action: "deactivate", cliente: c })}
                            disabled={!canEdit}
                          >
                            <Ban className="h-4 w-4" />
                          </IconAction>
                        ) : (
                          <IconAction
                            label="Reactivar"
                            onClick={() => setConfirm({ action: "reactivate", cliente: c })}
                            disabled={!canEdit}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </IconAction>
                        )}
                        <IconAction
                          label="Eliminar"
                          danger
                          onClick={() => setConfirm({ action: "delete", cliente: c })}
                          disabled={!canDelete}
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

      {/* Alta / edición */}
      {isFormOpen && (
        <ClientForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} initialData={editing} />
      )}

      {/* Confirmación (eliminar / baja / reactivar) */}
      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && confirmMutation.mutate(confirm)}
        title={copy?.title ?? ""}
        description={
          confirm && copy ? (
            <>
              {copy.desc}
              <br />
              <span className="mt-1 inline-block font-medium text-foreground">
                {clienteNombre(confirm.cliente)}
              </span>
            </>
          ) : undefined
        }
        confirmLabel={copy?.cta}
        variant={copy?.danger ? "danger" : "default"}
        isPending={confirmMutation.isPending}
      />
    </div>
  );
}
