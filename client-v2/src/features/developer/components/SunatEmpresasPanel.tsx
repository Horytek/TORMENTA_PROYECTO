import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { AdaptiveCollection } from "@/components/shared/AdaptiveCollection/AdaptiveCollection";
import type { FieldDef, RecordAction } from "@/components/shared/AdaptiveCollection/types";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FormDialog } from "@/components/shared/FormDialog";
import { FormField } from "@/components/shared/FormField";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { getEmpresasSunat, addEmpresa, updateEmpresa, deleteEmpresa } from "../api/sunat";
import type { EmpresaSunat, EmpresaSunatInput } from "../types";

/** Monedas soportadas (mismo catálogo que el módulo v1). */
export const MONEDAS = [
  { code: "PEN", name: "Sol peruano", country: "Perú", flag: "🇵🇪" },
  { code: "USD", name: "Dólar estadounidense", country: "Estados Unidos", flag: "🇺🇸" },
  { code: "EUR", name: "Euro", country: "Unión Europea", flag: "🇪🇺" },
  { code: "GBP", name: "Libra esterlina", country: "Reino Unido", flag: "🇬🇧" },
  { code: "JPY", name: "Yen japonés", country: "Japón", flag: "🇯🇵" },
];

const PAISES = Array.from(new Set(MONEDAS.map((m) => m.country))).sort((a, b) => a.localeCompare(b));

const emptyForm: EmpresaSunatInput = {
  ruc: "",
  razonSocial: "",
  nombreComercial: "",
  direccion: "",
  distrito: "",
  provincia: "",
  departamento: "",
  codigoPostal: "",
  telefono: "",
  email: "",
  logotipo: "",
  pais: "",
  moneda: "",
};

const parseMonedas = (moneda?: string | null): string[] =>
  moneda ? moneda.split(",").map((m) => m.trim()).filter(Boolean) : [];

export function SunatEmpresasPanel() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<EmpresaSunat | null>(null);
  const [deleting, setDeleting] = useState<EmpresaSunat | null>(null);
  const [form, setForm] = useState<EmpresaSunatInput>(emptyForm);
  const [monedas, setMonedas] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { data: empresas = [], isLoading } = useQuery({
    queryKey: ["sunat-empresas"],
    queryFn: getEmpresasSunat,
  });

  useEffect(() => {
    if (isFormOpen) {
      setForm(editing ? { ...emptyForm, ...editing } : emptyForm);
      setMonedas(parseMonedas(editing?.moneda));
      setError(null);
    }
  }, [isFormOpen, editing]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const input = { ...form, moneda: monedas.join(", ") };
      return editing ? updateEmpresa(editing.id_empresa, input) : addEmpresa(input);
    },
    onSuccess: (ok) => {
      if (!ok) { setError("No se pudo guardar la empresa."); return; }
      queryClient.invalidateQueries({ queryKey: ["sunat-empresas"] });
      setIsFormOpen(false);
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      setError(err?.response?.data?.message ?? "No se pudo guardar la empresa."),
  });

  const deleteMutation = useMutation({
    mutationFn: (e: EmpresaSunat) => deleteEmpresa(e.id_empresa),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sunat-empresas"] });
      setDeleting(null);
    },
  });

  const set = (key: keyof EmpresaSunatInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const toggleMoneda = (code: string) =>
    setMonedas((prev) => (prev.includes(code) ? prev.filter((m) => m !== code) : [...prev, code]));

  const fields: FieldDef<EmpresaSunat>[] = [
    { key: "razonSocial", label: "Razón social", priority: "primary", semantic: "title" },
    { key: "nombreComercial", label: "Nombre comercial", priority: "secondary", semantic: "subtitle" },
    {
      key: "moneda",
      label: "Monedas",
      priority: "secondary",
      semantic: "badge",
      render: (value) => {
        const list = parseMonedas(String(value ?? ""));
        return list.length ? (
          <span className="flex flex-wrap gap-1">
            {list.map((code) => (
              <Badge key={code} variant="outline" className="num">
                {MONEDAS.find((m) => m.code === code)?.flag} {code}
              </Badge>
            ))}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Sin monedas</span>
        );
      },
    },
    {
      key: "pais",
      label: "País",
      priority: "secondary",
      semantic: "chip",
      render: (value) => (value ? <Badge variant="ghost" className="bg-muted">{String(value)}</Badge> : null),
    },
    { key: "ruc", label: "RUC", priority: "meta", semantic: "code", format: (v) => (v ? `RUC ${v}` : "Sin RUC") },
  ];

  const actions: RecordAction[] = [
    {
      id: "edit",
      label: "Editar",
      icon: <Pencil className="h-3.5 w-3.5" />,
      onClick: (item) => { setEditing(item as EmpresaSunat); setIsFormOpen(true); },
    },
    {
      id: "delete",
      label: "Eliminar",
      icon: <Trash2 className="h-3.5 w-3.5" />,
      onClick: (item) => setDeleting(item as EmpresaSunat),
      variant: "destructive",
    },
  ];

  return (
    <>
      <AdaptiveCollection<EmpresaSunat>
        items={empresas}
        fields={fields}
        actions={actions}
        isLoading={isLoading}
        search={searchTerm}
        searchPlaceholder="Buscar por RUC o razón social…"
        onSearch={setSearchTerm}
        layout="list"
        totalCount={empresas.length}
        getItemId={(e) => e.id_empresa}
        empty={{
          title: "Sin empresas registradas",
          description: searchTerm ? "Ajusta el término de búsqueda." : "Registra la primera empresa.",
        }}
        globalActions={[
          {
            id: "create",
            label: "Nueva empresa",
            icon: <Plus className="h-4 w-4" />,
            onClick: () => { setEditing(null); setIsFormOpen(true); },
          },
        ]}
      />

      <FormDialog
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editing ? "Editar empresa" : "Nueva empresa"}
        description="Datos fiscales y regionales usados en comprobantes y SUNAT."
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.ruc?.trim() || !form.razonSocial?.trim()) {
            setError("RUC y razón social son obligatorios.");
            return;
          }
          setError(null);
          saveMutation.mutate();
        }}
        submitLabel="Guardar"
        isSubmitting={saveMutation.isPending}
        error={error}
        className="max-w-2xl"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField label="RUC" htmlFor="emp_ruc">
            <Input id="emp_ruc" value={form.ruc ?? ""} onChange={set("ruc")} />
          </FormField>
          <FormField label="Razón social" htmlFor="emp_razon">
            <Input id="emp_razon" value={form.razonSocial ?? ""} onChange={set("razonSocial")} />
          </FormField>
          <FormField label="Nombre comercial" htmlFor="emp_comercial" optional>
            <Input id="emp_comercial" value={form.nombreComercial ?? ""} onChange={set("nombreComercial")} />
          </FormField>
          <FormField label="Dirección" htmlFor="emp_direccion" optional>
            <Input id="emp_direccion" value={form.direccion ?? ""} onChange={set("direccion")} />
          </FormField>
          <FormField label="Distrito" htmlFor="emp_distrito" optional>
            <Input id="emp_distrito" value={form.distrito ?? ""} onChange={set("distrito")} />
          </FormField>
          <FormField label="Provincia" htmlFor="emp_provincia" optional>
            <Input id="emp_provincia" value={form.provincia ?? ""} onChange={set("provincia")} />
          </FormField>
          <FormField label="Departamento" htmlFor="emp_departamento" optional>
            <Input id="emp_departamento" value={form.departamento ?? ""} onChange={set("departamento")} />
          </FormField>
          <FormField label="Código postal" htmlFor="emp_cp" optional>
            <Input id="emp_cp" value={form.codigoPostal ?? ""} onChange={set("codigoPostal")} />
          </FormField>
          <FormField label="Teléfono" htmlFor="emp_telefono" optional>
            <Input id="emp_telefono" value={form.telefono ?? ""} onChange={set("telefono")} />
          </FormField>
          <FormField label="Email" htmlFor="emp_email" optional>
            <Input id="emp_email" type="email" value={form.email ?? ""} onChange={set("email")} />
          </FormField>
          <FormField label="Logotipo (URL)" htmlFor="emp_logo" optional>
            <Input id="emp_logo" value={form.logotipo ?? ""} onChange={set("logotipo")} />
          </FormField>
          <FormField label="País" optional>
            <Select
              value={form.pais || undefined}
              onValueChange={(v) => setForm((prev) => ({ ...prev, pais: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un país" />
              </SelectTrigger>
              <SelectContent>
                {PAISES.map((pais) => (
                  <SelectItem key={pais} value={pais}>{pais}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>

        <FormField label="Monedas" optional hint="Monedas habilitadas para la empresa (se guardan como lista).">
          <div className="grid grid-cols-1 gap-2 rounded-md border border-border/70 p-3 sm:grid-cols-2">
            {MONEDAS.map((moneda) => (
              <label key={moneda.code} className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={monedas.includes(moneda.code)}
                  onCheckedChange={() => toggleMoneda(moneda.code)}
                />
                <span className="text-base">{moneda.flag}</span>
                <span className="min-w-0 truncate">
                  <span className="num font-medium">{moneda.code}</span>
                  <span className="text-muted-foreground"> — {moneda.name}</span>
                </span>
              </label>
            ))}
          </div>
        </FormField>
      </FormDialog>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting)}
        title="¿Eliminar empresa?"
        description={
          <>
            Esta acción es permanente y puede afectar facturación y credenciales asociadas.
            <br />
            <span className="mt-1 inline-block font-medium text-foreground">{deleting?.razonSocial ?? ""}</span>
          </>
        }
        confirmLabel="Eliminar"
        variant="danger"
        isPending={deleteMutation.isPending}
      />
    </>
  );
}
