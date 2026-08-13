import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Percent } from "lucide-react";
import { adminCupones, adminSaveCupon } from "../api/catalogoPublico";
import { Button } from "@/components/ui/button";

export default function TiendaAdminCuponesPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ codigo: "", tipo: "porcentaje", valor: 10 });
  const { data: cupones, isLoading } = useQuery({
    queryKey: ["tienda-admin-cupones"],
    queryFn: adminCupones,
  });

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
          <Percent className="size-6" /> Cupones
        </h1>
        <p className="text-sm text-stone-500 mt-1">Descuentos aplicables en el checkout de la tienda.</p>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-stone-200 bg-white p-4">
        <input
          className="h-10 border rounded-lg px-3 text-sm"
          placeholder="Código"
          value={form.codigo}
          onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
        />
        <select
          className="h-10 border rounded-lg px-3 text-sm"
          value={form.tipo}
          onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
        >
          <option value="porcentaje">%</option>
          <option value="monto">Monto</option>
        </select>
        <input
          type="number"
          className="h-10 border rounded-lg px-3 text-sm w-24"
          value={form.valor}
          onChange={(e) => setForm((f) => ({ ...f, valor: Number(e.target.value) }))}
        />
        <Button
          size="sm"
          onClick={async () => {
            try {
              await adminSaveCupon(form);
              qc.invalidateQueries({ queryKey: ["tienda-admin-cupones"] });
              setForm({ codigo: "", tipo: "porcentaje", valor: 10 });
              toast.success("Cupón creado");
            } catch {
              toast.error("No se pudo crear");
            }
          }}
        >
          Crear
        </Button>
      </div>

      <ul className="text-sm space-y-1">
        {(cupones || []).map(
          (c: { id_cupon: number; codigo: string; tipo: string; valor: number; activo: number }) => (
            <li
              key={c.id_cupon}
              className="border border-stone-200 rounded-lg px-3 py-2 flex justify-between bg-white"
            >
              <span className="font-mono font-semibold">{c.codigo}</span>
              <span>
                {c.tipo === "porcentaje" ? `${c.valor}%` : `S/ ${c.valor}`} ·{" "}
                {c.activo ? "activo" : "off"}
              </span>
            </li>
          )
        )}
        {!isLoading && !(cupones || []).length && (
          <li className="text-stone-400 text-center py-6">Sin cupones.</li>
        )}
      </ul>
    </div>
  );
}
