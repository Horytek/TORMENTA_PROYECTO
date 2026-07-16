import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FormDialog } from "@/components/shared/FormDialog";
import { FormField } from "@/components/shared/FormField";
import { Input } from "@/components/ui/input";
import { createSubmodulo, updateSubmodulo } from "../api/developer";
import type { Modulo, Submodulo } from "../types";

interface SubmoduloFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Módulo padre (creación) o submódulo en edición. */
  parentModulo: Modulo | null;
  submodulo: Submodulo | null;
}

export function SubmoduloFormDialog({ isOpen, onClose, parentModulo, submodulo }: SubmoduloFormDialogProps) {
  const queryClient = useQueryClient();
  const [nombre, setNombre] = useState("");
  const [ruta, setRuta] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNombre(submodulo?.nombre_sub ?? "");
      setRuta(submodulo?.ruta_submodulo ?? "");
      setError(null);
    }
  }, [isOpen, submodulo]);

  const mutation = useMutation({
    mutationFn: () =>
      submodulo
        ? updateSubmodulo(submodulo.id_submodulo, { nombre_sub: nombre, ruta })
        : createSubmodulo({ id_modulo: parentModulo!.id_modulo, nombre_sub: nombre, ruta }),
    onSuccess: (ok) => {
      if (!ok) { setError("No se pudo guardar el submódulo."); return; }
      queryClient.invalidateQueries({ queryKey: ["developer-modulos"] });
      onClose();
    },
    onError: () => setError("No se pudo guardar el submódulo."),
  });

  return (
    <FormDialog
      open={isOpen}
      onClose={onClose}
      title={submodulo ? "Editar submódulo" : "Nuevo submódulo"}
      description={parentModulo ? `Para el módulo ${parentModulo.nombre_modulo}` : undefined}
      onSubmit={(e) => { e.preventDefault(); if (nombre.trim() && ruta.trim()) { setError(null); mutation.mutate(); } }}
      submitLabel="Guardar"
      isSubmitting={mutation.isPending}
      error={error}
    >
      <FormField label="Nombre del submódulo" htmlFor="nombre_sub">
        <Input id="nombre_sub" value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </FormField>
      <FormField label="Ruta del submódulo" htmlFor="ruta_sub" hint="Ej. /almacen/kardex">
        <Input id="ruta_sub" value={ruta} onChange={(e) => setRuta(e.target.value)} />
      </FormField>
    </FormDialog>
  );
}
