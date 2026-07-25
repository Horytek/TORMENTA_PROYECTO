import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Building2, Shield, FileKey, Server, Pencil, CheckCircle2, XCircle, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField } from "@/components/shared/FormField";
import { useUserStore } from "@/store/useUserStore";

import { getClaves, addClave, getFunciones, getPlanes, getEmpresaAccount, updateEmpresaAccount, uploadLogoBase64, fileToBase64Payload } from "../api/account";
import type { AccountFormValues, Clave, Funcion, Plan } from "../types";

const PLAN_LABELS: Record<string, string> = { "1": "Enterprise", "2": "Pro", "3": "Basic" };

const EMPTY_CLAVES: Clave[] = [];
const EMPTY_FUNCIONES: Funcion[] = [];
const EMPTY_PLANES: Plan[] = [];

const emptyForm: AccountFormValues = {
  ruc: "", razon_social: "", direccion: "",
  environment: "", sol_user: "", sol_pass: "",
  cert_password: "", certificadoBase64: "",
  logoBase64: "", client_id: "", client_secret: "",
};

interface AccountDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccountDrawer({ isOpen, onClose }: AccountDrawerProps) {
  const queryClient = useQueryClient();
  const user = useUserStore((s) => s.user);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<AccountFormValues>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const { data: empresa } = useQuery({
    queryKey: ["account-empresa", user?.id_empresa],
    queryFn: () => getEmpresaAccount(user!.id_empresa!),
    enabled: isOpen && !!user?.id_empresa,
    retry: false,
  });
  const { data: claves = EMPTY_CLAVES } = useQuery({
    queryKey: ["account-claves"],
    queryFn: getClaves,
    enabled: isOpen,
    retry: false,
  });
  const { data: funciones = EMPTY_FUNCIONES } = useQuery({
    queryKey: ["account-funciones"],
    queryFn: getFunciones,
    enabled: isOpen,
    retry: false,
  });
  const { data: planes = EMPTY_PLANES } = useQuery({
    queryKey: ["account-planes"],
    queryFn: getPlanes,
    enabled: isOpen,
    retry: false,
  });

  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setError(null);
      return;
    }
    if (!empresa) return;
    const keyMap: Record<string, string> = {};
    if (Array.isArray(claves)) {
      claves.filter((c) => c.id_empresa === empresa.id_empresa).forEach((c) => { keyMap[c.tipo] = c.valor; });
    }
    setForm({
      ruc: empresa.ruc || "",
      razon_social: empresa.razonSocial || empresa.nombreComercial || "",
      direccion: empresa.direccion || "",
      environment: keyMap["sunat_env"] || "",
      sol_user: keyMap["sunat_sol_user"] || "",
      sol_pass: keyMap["sunat_sol_pass"] || "",
      cert_password: keyMap["sunat_cert_pass"] || "",
      certificadoBase64: keyMap["sunat_cert_p12"] || "",
      client_id: keyMap["sunat_client_id"] || "",
      client_secret: keyMap["sunat_client_secret"] || "",
      logoBase64: "",
    });
  }, [isOpen, empresa, claves]);

  const planFuncionIds = (() => {
    const planObj = planes.find((p) => String(p.id_plan) === String(user?.plan_pago));
    if (!planObj) return [] as number[];
    if (planObj.funciones_detalles?.length) return planObj.funciones_detalles.map((f) => f.id_funcion);
    if (planObj.funciones) return planObj.funciones.split(",").map(Number);
    return [];
  })();

  const mutation = useMutation({
    mutationFn: async () => {
      const idEmpresa = user!.id_empresa!;

      // Datos básicos de la empresa (RUC / razón social / dirección)
      const fields: Record<string, string> = {};
      if (form.ruc.trim()) fields.ruc = form.ruc.trim();
      if (form.razon_social.trim()) fields.razonSocial = form.razon_social.trim();
      if (form.direccion.trim()) fields.direccion = form.direccion.trim();

      if (form.logoBase64) {
        const url = await uploadLogoBase64(form.logoBase64);
        fields.logotipo = url;
      }
      if (Object.keys(fields).length > 0) {
        await updateEmpresaAccount(idEmpresa, fields);
      }

      // Credenciales SUNAT: cada una como clave separada (upsert)
      const entries: [string, string][] = [
        ["sunat_sol_user", form.sol_user],
        ["sunat_sol_pass", form.sol_pass],
        ["sunat_env", form.environment],
        ["sunat_cert_p12", form.certificadoBase64],
        ["sunat_cert_pass", form.cert_password],
        ["sunat_client_id", form.client_id],
        ["sunat_client_secret", form.client_secret],
      ];
      for (const [tipo, valor] of entries) {
        if (valor?.trim()) {
          await addClave({ id_empresa: idEmpresa, tipo, valor: valor.trim() });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account-empresa"] });
      queryClient.invalidateQueries({ queryKey: ["account-claves"] });
      setIsEditing(false);
    },
    onError: () => setError("No se pudo guardar la configuración. Intenta de nuevo."),
  });

  const handleCertFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64Payload(file);
    setForm((f) => ({ ...f, certificadoBase64: base64 }));
  };
  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64Payload(file);
    setForm((f) => ({ ...f, logoBase64: base64 }));
  };

  const planLabel = PLAN_LABELS[String(user?.plan_pago)] || "Básico";

  return (
    <Sheet open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="flex h-full w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border/40 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <SheetTitle>Cuenta</SheetTitle>
              <SheetDescription className="text-xs">Información y configuración de la empresa</SheetDescription>
            </div>
            {!isEditing && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setIsEditing(true)}>
                <Pencil className="h-3.5 w-3.5" /> Editar
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {!isEditing ? (
            <>
              <div className="rounded-xl border border-border/40 bg-muted/10 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  {empresa?.logotipo ? (
                    <img src={empresa.logotipo} alt="Logo" className="h-12 w-12 rounded-lg border border-border object-contain bg-white" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 dark:bg-indigo-900/20">
                      <Building2 className="h-6 w-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">{empresa?.razonSocial || empresa?.nombreComercial || "Empresa"}</p>
                    <p className="text-xs text-muted-foreground truncate">RUC: {empresa?.ruc || "-"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 border-t border-border/40 pt-3 text-xs">
                  <div className="min-w-0 col-span-2 sm:col-span-1">
                    <span className="text-muted-foreground">Correo:</span>
                    <p className="font-medium text-foreground truncate" title={empresa?.email || "-"}>{empresa?.email || "-"}</p>
                  </div>
                  <div className="min-w-0 col-span-2 sm:col-span-1">
                    <span className="text-muted-foreground">Teléfono:</span>
                    <p className="font-medium text-foreground truncate">{empresa?.telefono || "-"}</p>
                  </div>
                  <div className="col-span-2 min-w-0">
                    <span className="text-muted-foreground">Dirección:</span>
                    <p className="font-medium text-foreground break-words">{empresa?.direccion || "-"}</p>
                  </div>
                  <div className="min-w-0">
                    <span className="text-muted-foreground">Plan:</span>
                    <p className="font-medium text-foreground truncate">{planLabel}</p>
                  </div>
                  <div className="min-w-0">
                    <span className="text-muted-foreground">Estado:</span>
                    <p className="font-medium text-foreground truncate">{empresa?.estado || "Activo"}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border/40 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5" /> Beneficios incluidos
                </div>
                {funciones.map((f) => {
                  const enabled = planFuncionIds.includes(f.id_funciones);
                  return (
                    <div key={f.id_funciones} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${enabled ? "bg-emerald-50 dark:bg-emerald-900/10" : "opacity-50"}`}>
                      {enabled ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <XCircle className="h-3.5 w-3.5 text-muted-foreground" />}
                      <span>{f.funcion}</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setError(null); mutation.mutate(); }} className="space-y-5">
              <div className="space-y-3 rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Building2 className="h-4 w-4" /> Datos de la empresa</div>
                <FormField label="RUC" htmlFor="ruc"><Input id="ruc" value={form.ruc} onChange={(e) => setForm((f) => ({ ...f, ruc: e.target.value }))} /></FormField>
                <FormField label="Razón social" htmlFor="razon_social"><Input id="razon_social" value={form.razon_social} onChange={(e) => setForm((f) => ({ ...f, razon_social: e.target.value }))} /></FormField>
                <FormField label="Dirección" htmlFor="direccion"><Input id="direccion" value={form.direccion} onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))} /></FormField>
                <FormField label="Logotipo" htmlFor="logo" optional hint="PNG o JPG"><Input id="logo" type="file" accept="image/png,image/jpeg" onChange={handleLogoFile} /></FormField>
              </div>

              <div className="space-y-3 rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Shield className="h-4 w-4" /> Configuración SUNAT</div>
                <FormField label="Entorno" htmlFor="environment">
                  <Select value={form.environment || undefined} onValueChange={(v) => setForm((f) => ({ ...f, environment: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecciona un entorno" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beta">Beta (Pruebas)</SelectItem>
                      <SelectItem value="prod">Producción</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Usuario SOL" htmlFor="sol_user"><Input id="sol_user" value={form.sol_user} onChange={(e) => setForm((f) => ({ ...f, sol_user: e.target.value }))} /></FormField>
                  <FormField label="Contraseña SOL" htmlFor="sol_pass"><Input id="sol_pass" type="password" value={form.sol_pass} onChange={(e) => setForm((f) => ({ ...f, sol_pass: e.target.value }))} /></FormField>
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><FileKey className="h-4 w-4" /> Certificado digital</div>
                <FormField label="Contraseña del certificado" htmlFor="cert_password"><Input id="cert_password" type="password" value={form.cert_password} onChange={(e) => setForm((f) => ({ ...f, cert_password: e.target.value }))} /></FormField>
                <FormField label="Certificado (.p12/.pfx)" htmlFor="cert" optional><Input id="cert" type="file" accept=".p12,.pfx" onChange={handleCertFile} /></FormField>
              </div>

              <div className="space-y-3 rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Server className="h-4 w-4" /> API GRE (opcional)</div>
                <FormField label="Client ID" htmlFor="client_id" optional><Input id="client_id" value={form.client_id} onChange={(e) => setForm((f) => ({ ...f, client_id: e.target.value }))} /></FormField>
                <FormField label="Client Secret" htmlFor="client_secret" optional><Input id="client_secret" type="password" value={form.client_secret} onChange={(e) => setForm((f) => ({ ...f, client_secret: e.target.value }))} /></FormField>
              </div>

              {error && <p className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)} disabled={mutation.isPending}>Cancelar</Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Guardar configuración
                </Button>
              </div>
            </form>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
