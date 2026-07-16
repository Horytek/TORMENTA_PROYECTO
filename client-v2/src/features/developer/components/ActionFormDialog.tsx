import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FormDialog } from "@/components/shared/FormDialog";
import { FormField } from "@/components/shared/FormField";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createAction, updateAction } from "../api/developer";
import type { CatalogAction } from "../types";

interface ActionFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  action: CatalogAction | null;
}

export function ActionFormDialog({ isOpen, onClose, action }: ActionFormDialogProps) {
  const queryClient = useQueryClient();
  const [actionKey, setActionKey] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActionKey(action?.action_key ?? "");
      setName(action?.name ?? "");
      setDescription(action?.description ?? "");
      setError(null);
    }
  }, [isOpen, action]);

  const mutation = useMutation({
    mutationFn: () =>
      action
        ? updateAction(action.id_action, { action_key: actionKey, name, description })
        : createAction({ action_key: actionKey, name, description }),
    onSuccess: (ok) => {
      if (!ok) { setError("No se pudo guardar la acción."); return; }
      queryClient.invalidateQueries({ queryKey: ["developer-actions"] });
      onClose();
    },
    onError: () => setError("No se pudo guardar la acción."),
  });

  const isValid = !!actionKey.trim() && !!name.trim();

  return (
    <FormDialog
      open={isOpen}
      onClose={onClose}
      title={action ? "Editar acción" : "Nueva acción global"}
      onSubmit={(e) => { e.preventDefault(); if (isValid) { setError(null); mutation.mutate(); } }}
      submitLabel="Guardar"
      isSubmitting={mutation.isPending}
      error={error}
    >
      <FormField label="Clave (key)" htmlFor="action_key" hint="Identificador único para usar en código." error={undefined}>
        <Input id="action_key" placeholder="ej: exportar_excel" value={actionKey} onChange={(e) => setActionKey(e.target.value)} disabled={!!action} />
      </FormField>
      <FormField label="Nombre visible" htmlFor="name">
        <Input id="name" placeholder="ej: Exportar Excel" value={name} onChange={(e) => setName(e.target.value)} />
      </FormField>
      <FormField label="Descripción" htmlFor="description" optional>
        <Textarea id="description" placeholder="Descripción corta…" value={description} onChange={(e) => setDescription(e.target.value)} />
      </FormField>
    </FormDialog>
  );
}
