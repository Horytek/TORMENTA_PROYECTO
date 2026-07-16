import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FormDialog } from "@/components/shared/FormDialog";
import { FormField } from "@/components/shared/FormField";
import { Input } from "@/components/ui/input";
import { createModulo, updateModulo } from "../api/developer";
import type { Modulo } from "../types";

interface ModuloFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  modulo: Modulo | null;
}

export function ModuloFormDialog({ isOpen, onClose, modulo }: ModuloFormDialogProps) {
  const queryClient = useQueryClient();
  const [nombre, setNombre] = useState("");
  const [ruta, setRuta] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNombre(modulo?.nombre_modulo ?? "");
      setRuta(modulo?.ruta ?? "");
      setError(null);
    }
  }, [isOpen, modulo]);

  const mutation = useMutation({
    mutationFn: () =>
      modulo
        ? updateModulo(modulo.id_modulo, { nombre, ruta })
        : createModulo({ nombre, ruta }),
    onSuccess: (ok) => {
      if (!ok) { setError("No se pudo guardar el módulo."); return; }
      queryClient.invalidateQueries({ queryKey: ["developer-modulos"] });
      onClose();
    },
    onError: () => setError("No se pudo guardar el módulo."),
  });

  return (
    <FormDialog
      open={isOpen}
      onClose={onClose}
      title={modulo ? "Editar módulo" : "Nuevo módulo"}
      onSubmit={(e) => { e.preventDefault(); if (nombre.trim() && ruta.trim()) { setError(null); mutation.mutate(); } }}
      submitLabel="Guardar"
      isSubmitting={mutation.isPending}
      error={error}
    >
      <FormField label="Nombre del módulo" htmlFor="nombre_modulo">
        <Input id="nombre_modulo" value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </FormField>
      <FormField label="Ruta del módulo" htmlFor="ruta_modulo" hint="Ej. /almacen">
        <Input id="ruta_modulo" value={ruta} onChange={(e) => setRuta(e.target.value)} />
      </FormField>
    </FormDialog>
  );
}
