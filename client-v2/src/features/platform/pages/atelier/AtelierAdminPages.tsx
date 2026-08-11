import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AtelierAdminShell } from "./AtelierShells";
import {
  getAtelierAdminDashboard,
  getAtelierCommission,
  listAtelierAdminOrders,
  listAtelierAdminUsers,
  updateAtelierCommission,
} from "@/features/platform/api/atelier";

export default function AtelierAdminPages() {
  const location = useLocation();
  const [data, setData] = useState<any>(null);
  const page = location.pathname.includes("pedidos")
    ? "Pedidos"
    : location.pathname.includes("usuarios")
      ? "Usuarios"
      : location.pathname.includes("comision")
        ? "Comisión"
        : "Resumen";

  const load = () => {
    const fn =
      page === "Pedidos"
        ? listAtelierAdminOrders
        : page === "Usuarios"
          ? listAtelierAdminUsers
          : page === "Comisión"
            ? getAtelierCommission
            : getAtelierAdminDashboard;
    void fn()
      .then((r: any) => setData(r.data))
      .catch(() => setData(null));
  };

  useEffect(() => {
    load();
  }, [page]);

  const rows = Array.isArray(data) ? data : [];
  const kpiLabels: Record<string, string> = {
    gmv: "GMV",
    fees: "Platform fees",
    orders_count: "Pedidos",
  };

  return (
    <AtelierAdminShell title={page} subtitle={page === "Resumen" ? "Operación y salud del marketplace." : undefined}>
      {page === "Comisión" ? (
        <form
          className="max-w-lg rounded-xl bg-white p-5 shadow-sm"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            void updateAtelierCommission({
              scope: "global",
              percent: Number(fd.get("percent")),
              min_fee: fd.get("min_fee") ? Number(fd.get("min_fee")) : null,
              max_fee: fd.get("max_fee") ? Number(fd.get("max_fee")) : null,
              activo: true,
            }).then(load);
          }}
        >
          <h2 className="font-semibold">Regla de comisión global</h2>
          <div className="mt-4 grid gap-3">
            <Input name="percent" type="number" step="0.01" defaultValue={data?.percent ?? 10} placeholder="Porcentaje" />
            <Input name="min_fee" type="number" step="0.01" defaultValue={data?.min_fee ?? ""} placeholder="Mínimo S/" />
            <Input name="max_fee" type="number" step="0.01" defaultValue={data?.max_fee ?? ""} placeholder="Máximo S/" />
          </div>
          <Button className="mt-4 bg-[#DB2777] hover:bg-[#BE185D]">Guardar comisión</Button>
        </form>
      ) : page === "Resumen" ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Object.entries(data || {})
            .filter(([, v]) => typeof v === "number" || (typeof v === "string" && !Number.isNaN(Number(v))))
            .map(([key, value]) => (
              <article key={key} className="rounded-xl bg-white p-5 shadow-sm">
                <p className="text-sm text-stone-500">{kpiLabels[key] || key.replaceAll("_", " ")}</p>
                <p className="mt-2 text-3xl font-semibold">{String(value)}</p>
              </article>
            ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-stone-500">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">Nombre / referencia</th>
                <th className="p-4">Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id_user || row.id_order} className="border-b last:border-0">
                  <td className="p-4">#{row.id_user || row.id_order}</td>
                  <td className="p-4">{row.nombre || row.email || row.titulo || "—"}</td>
                  <td className="p-4">{row.estado || row.role || "Activo"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AtelierAdminShell>
  );
}
