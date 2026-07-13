import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useQueryState, parseAsString } from "nuqs";
import { Plus, Pencil, Trash2, Ban, RotateCcw } from "lucide-react";

import { AdaptiveCollection } from "@/components/shared/AdaptiveCollection";
import type { FieldDef, RecordAction } from "@/components/shared/AdaptiveCollection";
import { useUserStore } from "@/store/useUserStore";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
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

  const fields: FieldDef<Cliente>[] = [
    {
      key: "nombres",
      priority: "primary",
      semantic: "title",
      label: "Cliente",
      render: (_, c) => clienteNombre(c),
    },
    {
      key: "direccion",
      priority: "secondary",
      semantic: "subtitle",
      label: "Dirección",
      format: (v) => (v as string) || "—",
    },
    {
      key: "estado",
      priority: "secondary",
      semantic: "badge",
      label: "Estado",
      format: (v) => Number(v) === 1 ? "Activo" : "Inactivo",
    },
    {
      key: "ruc",
      priority: "meta",
      semantic: "code",
      label: "Documento",
      render: (_, c) => `${clienteTipo(c) === "juridico" ? "RUC" : "DNI"}: ${clienteDocumento(c)}`,
    },
  ];

  const getRhythm = (c: Cliente) => ({
    type: "dot" as const,
    color: Number(c.estado) === 1 ? "emerald" as const : "rose" as const,
  });

  const actions: RecordAction[] = [
    {
      id: "edit",
      label: "Editar",
      icon: <Pencil className="h-4 w-4" />,
      onClick: (item) => openEdit(item as Cliente),
      disabled: !canEdit,
    },
    {
      id: "deactivate",
      label: "Dar de baja",
      icon: <Ban className="h-4 w-4" />,
      onClick: (item) => setConfirm({ action: "deactivate", cliente: item as Cliente }),
      disabled: !canEdit,
      hidden: (item) => Number((item as Cliente).estado) !== 1,
    },
    {
      id: "reactivate",
      label: "Reactivar",
      icon: <RotateCcw className="h-4 w-4" />,
      onClick: (item) => setConfirm({ action: "reactivate", cliente: item as Cliente }),
      disabled: !canEdit,
      hidden: (item) => Number((item as Cliente).estado) === 1,
    },
    {
      id: "delete",
      label: "Eliminar",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (item) => setConfirm({ action: "delete", cliente: item as Cliente }),
      variant: "destructive",
      disabled: !canDelete,
    },
  ];

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
      <AdaptiveCollection<Cliente>
        title="Clientes"
        items={clientes}
        fields={fields}
        actions={actions}
        layout="card"
        isLoading={isLoading}
        search={searchTerm}
        searchPlaceholder="Buscar por nombre o documento…"
        onSearch={setSearchTerm}
        empty={{
          title: "No se encontraron clientes",
          description: searchTerm
            ? `Ningún cliente coincide con "${searchTerm}"`
            : "Registra tu primer cliente.",
          action: canEdit ? { label: "Nuevo cliente", onClick: openCreate } : undefined,
        }}
        getItemId={(c: Cliente) => c.id}
        getRhythm={getRhythm}
        globalActions={
          canEdit
            ? [{ id: "create", label: "Nuevo cliente", icon: <Plus className="h-4 w-4" />, onClick: () => openCreate() }]
            : []
        }
      />

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
