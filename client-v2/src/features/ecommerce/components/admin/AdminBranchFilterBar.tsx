import { useEcommerceAuthStore } from "../../store/useEcommerceAuthStore";
import { useAdminBranchFilter } from "../../store/useAdminBranchFilter";

export function AdminBranchFilterBar() {
  const user = useEcommerceAuthStore((s) => s.user);
  const id_sucursal = useAdminBranchFilter((s) => s.id_sucursal);
  const setSucursal = useAdminBranchFilter((s) => s.setSucursal);
  const sucursales = user?.sucursales || [];
  const global = user?.acceso_global !== false;
  const locked = !global && sucursales.length === 1;

  if (!sucursales.length) return null;

  const value = locked ? String(sucursales[0].id_sucursal) : id_sucursal ? String(id_sucursal) : "";

  return (
    <label className="inline-flex items-center gap-2 text-sm text-stone-600">
      <span className="text-xs uppercase tracking-wide text-stone-400">Sucursal</span>
      <select
        className="h-9 rounded-md border border-stone-200 bg-white px-2 text-sm"
        disabled={locked}
        value={value}
        onChange={(e) => setSucursal(e.target.value ? Number(e.target.value) : null)}
      >
        {global && <option value="">Todas</option>}
        {sucursales.map((s) => (
          <option key={s.id_sucursal} value={s.id_sucursal}>
            {s.nombre}
          </option>
        ))}
      </select>
    </label>
  );
}

export function useScopedSucursalId() {
  const user = useEcommerceAuthStore((s) => s.user);
  const id_sucursal = useAdminBranchFilter((s) => s.id_sucursal);
  const sucursales = user?.sucursales || [];
  const global = user?.acceso_global !== false;
  if (!global && sucursales.length === 1) return sucursales[0].id_sucursal;
  return id_sucursal;
}
