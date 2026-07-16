import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, Trash2, Building2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { getEmpresasList, clearTenantData } from "../api/developer";

export function DatabaseCleanerTab() {
  const [selectedCompany, setSelectedCompany] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const { data: empresas = [] } = useQuery({ queryKey: ["developer-empresas"], queryFn: getEmpresasList });

  const mutation = useMutation({
    mutationFn: () => clearTenantData(selectedCompany),
    onSuccess: (res) => {
      setResult({ ok: res.success, message: res.success ? "Todos los datos transaccionales fueron limpiados correctamente." : (res.message || "Error al limpiar datos.") });
      if (res.success) setConfirmed(false);
    },
  });

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Limpiador de base de datos</p>
          <p className="text-xs text-muted-foreground">Herramienta para desarrolladores. Elimina datos de prueba de forma recursiva.</p>
        </div>
      </div>

      <div className="space-y-2 rounded-xl border border-border p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground"><Building2 className="h-4 w-4" /> Empresa objetivo (tenant)</div>
        <Select value={selectedCompany || undefined} onValueChange={setSelectedCompany}>
          <SelectTrigger><SelectValue placeholder="Selecciona una empresa" /></SelectTrigger>
          <SelectContent>
            {empresas.map((e) => (
              <SelectItem key={e.id_empresa} value={String(e.id_empresa)}>{e.razonSocial} (ID: {e.id_empresa})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4 rounded-xl border border-destructive/30 p-4">
        <div>
          <p className="text-sm font-semibold text-destructive">Peligro: borrado de datos</p>
          <p className="text-xs text-muted-foreground">Esta acción limpiará permanentemente el historial.</p>
        </div>
        <ul className="list-disc space-y-1 pl-5 text-xs text-destructive/90">
          <li>Elimina todas las ventas (facturas, boletas, notas de venta).</li>
          <li>Elimina movimientos (notas de entrada/salida y caja).</li>
          <li>Resetea el stock a cero y limpia la bitácora/kárdex.</li>
        </ul>
        <p className="flex items-start gap-2 rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          Asegúrate de tener un respaldo. Estos cambios afectan reportes y contabilidad de forma irreversible.
        </p>

        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={confirmed} onCheckedChange={(v) => setConfirmed(!!v)} />
          Entiendo las consecuencias y deseo proceder
        </label>

        <Button
          variant="destructive"
          className="w-full gap-2"
          disabled={!confirmed || !selectedCompany || mutation.isPending}
          onClick={() => { setResult(null); mutation.mutate(); }}
        >
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          {mutation.isPending ? "Ejecutando limpieza…" : "Limpiar todos los datos"}
        </Button>

        {result && (
          <p className={`rounded-md px-3 py-2 text-sm ${result.ok ? "border border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "border border-destructive/25 bg-destructive/10 text-destructive"}`}>
            {result.message}
          </p>
        )}
      </div>
    </div>
  );
}
