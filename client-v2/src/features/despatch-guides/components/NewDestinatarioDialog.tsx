import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FormDialog } from "@/components/shared/FormDialog";
import { FormField } from "@/components/shared/FormField";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addDestinatarioNatural, addDestinatarioJuridico } from "../api/guides";

interface NewDestinatarioDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}

export function NewDestinatarioDialog({ isOpen, onClose, onCreated }: NewDestinatarioDialogProps) {
  const queryClient = useQueryClient();
  const [tipo, setTipo] = useState<"natural" | "juridico">("natural");
  const [dniOrRuc, setDniOrRuc] = useState("");
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [direccion, setDireccion] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setDniOrRuc("");
    setNombres("");
    setApellidos("");
    setRazonSocial("");
    setDireccion("");
    setError(null);
  };

  const mutation = useMutation({
    mutationFn: () =>
      tipo === "natural"
        ? addDestinatarioNatural({ dni: dniOrRuc, nombres, apellidos, ubicacion: direccion })
        : addDestinatarioJuridico({ ruc: dniOrRuc, razon_social: razonSocial, ubicacion: direccion }),
    onSuccess: (result) => {
      if (!result.success) {
        setError(result.message || "No se pudo registrar el destinatario.");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["guia-destinatarios"] });
      const newId = result.id_destinatario ? String(result.id_destinatario) : "";
      reset();
      onClose();
      if (newId) onCreated(newId);
    },
    onError: () => setError("No se pudo registrar el destinatario."),
  });

  const isValid =
    tipo === "natural"
      ? dniOrRuc.length === 8 && !!nombres && !!apellidos && !!direccion
      : dniOrRuc.length === 11 && !!razonSocial && !!direccion;

  return (
    <FormDialog
      open={isOpen}
      onClose={() => { reset(); onClose(); }}
      title="Nuevo destinatario"
      description="Registra a quién se le entrega la mercadería."
      onSubmit={(e) => { e.preventDefault(); if (isValid) mutation.mutate(); }}
      submitLabel="Guardar"
      isSubmitting={mutation.isPending}
      error={error}
    >
      <Tabs value={tipo} onValueChange={(v) => setTipo(v as "natural" | "juridico")}>
        <TabsList className="w-full">
          <TabsTrigger value="natural" className="flex-1">Persona natural</TabsTrigger>
          <TabsTrigger value="juridico" className="flex-1">Persona jurídica</TabsTrigger>
        </TabsList>
      </Tabs>

      <FormField label={tipo === "natural" ? "DNI" : "RUC"} htmlFor="dniOrRuc">
        <Input
          id="dniOrRuc"
          inputMode="numeric"
          maxLength={tipo === "natural" ? 8 : 11}
          value={dniOrRuc}
          onChange={(e) => setDniOrRuc(e.target.value.replace(/\D/g, ""))}
        />
      </FormField>

      {tipo === "natural" ? (
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Nombres" htmlFor="nombres">
            <Input id="nombres" value={nombres} onChange={(e) => setNombres(e.target.value)} />
          </FormField>
          <FormField label="Apellidos" htmlFor="apellidos">
            <Input id="apellidos" value={apellidos} onChange={(e) => setApellidos(e.target.value)} />
          </FormField>
        </div>
      ) : (
        <FormField label="Razón social" htmlFor="razonSocial">
          <Input id="razonSocial" value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} />
        </FormField>
      )}

      <FormField label="Dirección" htmlFor="direccion">
        <Input id="direccion" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
      </FormField>
    </FormDialog>
  );
}
