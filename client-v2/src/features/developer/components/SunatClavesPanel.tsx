import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { AdaptiveCollection } from "@/components/shared/AdaptiveCollection/AdaptiveCollection";
import type { FieldDef, RecordAction } from "@/components/shared/AdaptiveCollection/types";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FormDialog } from "@/components/shared/FormDialog";
import { FormField } from "@/components/shared/FormField";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { getClaves, addClave, updateClave, deleteClave } from "@/features/account/api/account";
import type { Clave } from "@/features/account/types";
import { getEmpresasSunat } from "../api/sunat";

/** true si el valor escrito es real (no vacío ni la máscara de bullets). */
const isRealValue = (value: string) => value.trim() !== "" && !/[•●]/.test(value);

export function SunatClavesPanel() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [empresaFilter, setEmpresaFilter] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Clave | null>(null);
  const [deleting, setDeleting] = useState<Clave | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [idEmpresa, setIdEmpresa] = useState("");
  const [tipo, setTipo] = useState("");
  const [valor, setValor] = useState("");
  const [estado, setEstado] = useState("1");

  const { data: claves = [], isLoading } = useQuery({ queryKey: ["sunat-claves"], queryFn: getClaves });
  const { data: empresas = [] } = useQuery({ queryKey: ["sunat-empresas"], queryFn: getEmpresasSunat });

  useEffect(() => {
    if (isFormOpen) {
      setIdEmpresa(editing ? String(editing.id_empresa) : "");
      setTipo(editing?.tipo ?? "Sunat");
      setValor("");
      setEstado(String(editing?.estado_clave ?? 1));
      setError(null);
    }
  }, [isFormOpen, editing]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const input = {
        id_empresa: Number(idEmpresa),
        tipo: tipo.trim(),
        valor,
        estado_clave: Number(estado),
      };
      return editing ? updateClave(editing.id_clave, input) : addClave(input);
    },
    onSuccess: (ok) => {
      if (!ok) { setError("No se pudo guardar la clave."); return; }
      queryClient.invalidateQueries({ queryKey: ["sunat-claves"] });
      setIsFormOpen(false);
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      setError(err?.response?.data?.message ?? "No se pudo guardar la clave."),
  });

  const deleteMutation = useMutation({
    mutationFn: (c: Clave) => deleteClave(c.id_clave),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sunat-claves"] });
      setDeleting(null);
    },
  });

  const fields: FieldDef<Clave>[] = [
    { key: "razonSocial", label: "Empresa", priority: "primary", semantic: "title", format: (v) => String(v ?? "—") },
    {
      key: "tipo",
      label: "Tipo",
      priority: "secondary",
      semantic: "badge",
      render: (value) => <Badge variant="outline" className="num">{String(value ?? "—")}</Badge>,
    },
    {
      key: "hasValue",
      label: "Valor",
      priority: "secondary",
      semantic: "chip",
      render: (value) =>
        value ? (
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">••••••••••••</code>
        ) : (
          <Badge variant="warning">Sin valor</Badge>
        ),
    },
    {
      key: "estado_clave",
      label: "Estado",
      priority: "secondary",
      semantic: "badge",
      render: (value) =>
        Number(value) === 1 ? <Badge variant="success">Activa</Badge> : <Badge variant="ghost" className="bg-muted">Inactiva</Badge>,
    },
    { key: "id_clave", label: "ID", priority: "meta", semantic: "code", format: (v) => `#${v}` },
  ];

  const actions: RecordAction[] = [
    {
      id: "edit",
      label: "Editar",
      icon: <Pencil className="h-3.5 w-3.5" />,
      onClick: (item) => { setEditing(item as Clave); setIsFormOpen(true); },
    },
    {
      id: "delete",
      label: "Eliminar",
      icon: <Trash2 className="h-3.5 w-3.5" />,
      onClick: (item) => setDeleting(item as Clave),
      variant: "destructive",
    },
  ];

  return (
    <>
      <AdaptiveCollection<Clave>
        items={claves}
        fields={fields}
        actions={actions}
        isLoading={isLoading}
        search={searchTerm}
        searchPlaceholder="Buscar por tipo o empresa…"
        onSearch={setSearchTerm}
        layout="list"
        totalCount={claves.length}
        getItemId={(c) => c.id_clave}
        filters={[
          {
            id: "id_empresa",
            label: "Empresa",
            value: empresaFilter,
            onChange: setEmpresaFilter,
            options: empresas.map((e) => ({ value: String(e.id_empresa), label: e.razonSocial })),
          },
        ]}
        empty={{
          title: "Sin claves registradas",
          description: "Registra las credenciales SUNAT o de servicios externos por empresa.",
        }}
        globalActions={[
          {
            id: "create",
            label: "Nueva clave",
            icon: <Plus className="h-4 w-4" />,
            onClick: () => { setEditing(null); setIsFormOpen(true); },
          },
        ]}
      />

      <FormDialog
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editing ? "Editar clave" : "Nueva clave"}
        description="El valor se guarda encriptado; nunca se vuelve a mostrar en claro."
        onSubmit={(e) => {
          e.preventDefault();
          if (!idEmpresa || !tipo.trim()) {
            setError("Empresa y tipo son obligatorios.");
            return;
          }
          if (!editing && !isRealValue(valor)) {
            setError("Ingresa el valor de la clave.");
            return;
          }
          setError(null);
          saveMutation.mutate();
        }}
        submitLabel={editing ? "Actualizar" : "Guardar"}
        isSubmitting={saveMutation.isPending}
        error={error}
      >
        <FormField label="Empresa">
          <Select value={idEmpresa || undefined} onValueChange={setIdEmpresa}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una empresa" />
            </SelectTrigger>
            <SelectContent>
              {empresas.map((e) => (
                <SelectItem key={e.id_empresa} value={String(e.id_empresa)}>{e.razonSocial}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Tipo" htmlFor="clave_tipo" hint='Ej. "Sunat", "sunat_sol_user", "sunat_cert_pass".'>
          <Input id="clave_tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} />
        </FormField>

        <FormField
          label="Valor"
          htmlFor="clave_valor"
          hint={editing ? "Dejar vacío para mantener el valor actual." : "Se encripta al guardar."}
        >
          <Textarea
            id="clave_valor"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder={editing ? "•••••••••••• (sin cambios)" : "Ingresa el token o credencial"}
            rows={3}
          />
        </FormField>

        <FormField label="Estado">
          <Select value={estado} onValueChange={setEstado}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Activa</SelectItem>
              <SelectItem value="0">Inactiva</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </FormDialog>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting)}
        title="¿Eliminar clave?"
        description={
          <>
            La empresa asociada dejará de poder facturar con esta credencial.
            <br />
            <span className="mt-1 inline-block font-medium text-foreground">
              {deleting ? `${deleting.razonSocial ?? "Empresa"} — ${deleting.tipo}` : ""}
            </span>
          </>
        }
        confirmLabel="Eliminar"
        variant="danger"
        isPending={deleteMutation.isPending}
      />
    </>
  );
}
