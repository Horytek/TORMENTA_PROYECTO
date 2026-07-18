import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FormDialog } from "@/components/shared/FormDialog";
import { FormField } from "@/components/shared/FormField";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPlatformUser } from "../api/developer";

interface NewPlatformUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewPlatformUserDialog({ isOpen, onClose }: NewPlatformUserDialogProps) {
  const queryClient = useQueryClient();
  const [usua, setUsua] = useState("");
  const [contra, setContra] = useState("");
  const [estado, setEstado] = useState("1");
  const [error, setError] = useState<string | null>(null);

  const reset = () => { setUsua(""); setContra(""); setEstado("1"); setError(null); };

  const mutation = useMutation({
    mutationFn: () => createPlatformUser({ id_rol: 1, usua, contra, estado_usuario: Number(estado) }),
    onSuccess: (ok) => {
      if (!ok) { setError("No se pudo crear el usuario."); return; }
      queryClient.invalidateQueries({ queryKey: ["developer-platform-users"] });
      reset();
      onClose();
    },
    onError: () => setError("No se pudo crear el usuario."),
  });

  const isValid = !!usua.trim() && !!contra.trim();

  return (
    <FormDialog
      open={isOpen}
      onClose={() => { reset(); onClose(); }}
      title="Nuevo usuario administrador"
      description="Se crea con rol Administrador. Asigna la empresa y el plan después de guardar."
      onSubmit={(e) => { e.preventDefault(); if (isValid) { setError(null); mutation.mutate(); } }}
      submitLabel="Guardar"
      isSubmitting={mutation.isPending}
      error={error}
    >
      <FormField label="Usuario" htmlFor="usua"><Input id="usua" value={usua} onChange={(e) => setUsua(e.target.value)} /></FormField>
      <FormField label="Contraseña" htmlFor="contra"><Input id="contra" type="password" value={contra} onChange={(e) => setContra(e.target.value)} /></FormField>
      <FormField label="Estado" htmlFor="estado">
        <Select value={estado} onValueChange={setEstado}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Activo</SelectItem>
            <SelectItem value="0">Inactivo</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
    </FormDialog>
  );
}
