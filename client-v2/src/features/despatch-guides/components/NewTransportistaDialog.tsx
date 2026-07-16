import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormDialog } from "@/components/shared/FormDialog";
import { FormField } from "@/components/shared/FormField";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addTransportistaPublico, addTransportistaPrivado, generarCodigoTransportista } from "../api/guides";

interface NewTransportistaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function NewTransportistaDialog({ isOpen, onClose, onCreated }: NewTransportistaDialogProps) {
  const queryClient = useQueryClient();
  const [tipo, setTipo] = useState<"publico" | "privado">("publico");
  const [documento, setDocumento] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [placa, setPlaca] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: nuevoId } = useQuery({
    queryKey: ["guia-codigo-transportista", isOpen],
    queryFn: generarCodigoTransportista,
    enabled: isOpen,
  });

  useEffect(() => {
    if (!isOpen) {
      setDocumento(""); setNombre(""); setApellidos(""); setPlaca(""); setTelefono(""); setDireccion(""); setError(null);
    }
  }, [isOpen]);

  const mutation = useMutation({
    mutationFn: () =>
      tipo === "publico"
        ? addTransportistaPublico({ id: nuevoId || "", ruc: documento, razon_social: nombre, ubicacion: direccion, placa, telefono })
        : addTransportistaPrivado({ id: nuevoId || "", dni: documento, nombres: nombre, apellidos, ubicacion: direccion, placa, telefono }),
    onSuccess: (result) => {
      if (!result.success) {
        setError(result.message || "No se pudo registrar el transportista.");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["guia-transportistas-publicos"] });
      queryClient.invalidateQueries({ queryKey: ["guia-transportistas-privados"] });
      onClose();
      onCreated();
    },
    onError: () => setError("No se pudo registrar el transportista."),
  });

  const isValid =
    !!nuevoId &&
    !!direccion &&
    (tipo === "publico" ? documento.length === 11 && !!nombre : documento.length === 8 && !!nombre && !!apellidos);

  return (
    <FormDialog
      open={isOpen}
      onClose={onClose}
      title="Nuevo transportista"
      description="Registra la empresa de transporte o el conductor."
      onSubmit={(e) => { e.preventDefault(); if (isValid) mutation.mutate(); }}
      submitLabel="Guardar"
      isSubmitting={mutation.isPending}
      error={error}
    >
      <Tabs value={tipo} onValueChange={(v) => setTipo(v as "publico" | "privado")}>
        <TabsList className="w-full">
          <TabsTrigger value="publico" className="flex-1">Transporte público</TabsTrigger>
          <TabsTrigger value="privado" className="flex-1">Transporte privado</TabsTrigger>
        </TabsList>
      </Tabs>

      <FormField label={tipo === "publico" ? "RUC" : "DNI"} htmlFor="documento">
        <Input
          id="documento"
          inputMode="numeric"
          maxLength={tipo === "publico" ? 11 : 8}
          value={documento}
          onChange={(e) => setDocumento(e.target.value.replace(/\D/g, ""))}
        />
      </FormField>

      {tipo === "publico" ? (
        <FormField label="Razón social" htmlFor="nombre">
          <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </FormField>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Nombres" htmlFor="nombre">
            <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </FormField>
          <FormField label="Apellidos" htmlFor="apellidos">
            <Input id="apellidos" value={apellidos} onChange={(e) => setApellidos(e.target.value)} />
          </FormField>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Placa" htmlFor="placa" optional>
          <Input id="placa" value={placa} onChange={(e) => setPlaca(e.target.value.toUpperCase())} />
        </FormField>
        <FormField label="Teléfono" htmlFor="telefono" optional>
          <Input id="telefono" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        </FormField>
      </div>

      <FormField label="Dirección" htmlFor="direccion">
        <Input id="direccion" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
      </FormField>
    </FormDialog>
  );
}
