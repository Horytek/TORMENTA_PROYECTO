import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Shield } from "lucide-react";
import { adminListRoles, adminPatchRol } from "../api/ecommerce";
import { useEcommerceAuthStore } from "../store/useEcommerceAuthStore";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Permiso = { codigo: string; modulo: string; accion: string };
type Rol = {
  id_rol: number;
  codigo: string;
  nombre: string;
  es_sistema: boolean;
  acceso_global: boolean;
  permisos: string[];
};

const ACCION_LABEL: Record<string, string> = {
  ver: "Ver",
  crear: "Crear",
  editar: "Editar",
  eliminar: "Borrar",
  cancelar: "Cancelar",
  confirmar: "Confirmar",
  escanear: "Escanear",
  desactivar: "Desactivar",
};

const SECTIONS: { label: string; hint: string; modulos: string[] }[] = [
  {
    label: "Ventas y pedidos",
    hint: "Lo que pasa cuando alguien compra",
    modulos: ["Dashboard", "Pedidos", "Recojo", "Órdenes", "Entregas"],
  },
  {
    label: "Inventario",
    hint: "Stock y movimientos entre sucursales",
    modulos: ["Stock", "Inventario", "Transferencias"],
  },
  {
    label: "Catálogo",
    hint: "Productos, tallas, colores",
    modulos: ["Productos", "Atributos"],
  },
  {
    label: "Equipo",
    hint: "Quién entra y a qué sucursal",
    modulos: ["Sucursales", "Usuarios", "Roles"],
  },
  {
    label: "Tienda",
    hint: "Apariencia y opiniones",
    modulos: ["Reseñas", "Configuración"],
  },
];

const ROL_HINT: Record<string, string> = {
  administrador: "Puede todo, en todas las sucursales",
  gerente: "Casi todo, sin tocar la configuración fina",
  encargado_sucursal: "Maneja su sucursal: pedidos, stock y recojo",
  vendedor: "Atiende ventas y consulta stock",
  personal_recojo: "Entrega pedidos en tienda",
  consulta_stock: "Solo mira el stock",
  operador_tienda: "Día a día de la tienda",
};

export default function EcommerceRolesPage() {
  const qc = useQueryClient();
  const tid = useEcommerceAuthStore((s) => s.user?.id_tienda);
  const [selected, setSelected] = useState<number | null>(null);
  const [draftPerms, setDraftPerms] = useState<string[] | null>(null);
  const [draftGlobal, setDraftGlobal] = useState<boolean | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["ecom-roles", tid],
    queryFn: adminListRoles,
    enabled: Boolean(tid),
  });
  const roles = (data?.data?.roles || []) as Rol[];
  const permisos = (data?.data?.permisos || []) as Permiso[];
  const rol = roles.find((r) => r.id_rol === selected) || roles[0];

  useEffect(() => {
    setDraftPerms(null);
    setDraftGlobal(null);
  }, [rol?.id_rol]);

  const checked = new Set(draftPerms ?? rol?.permisos ?? []);
  const accesoGlobal = draftGlobal ?? Boolean(rol?.acceso_global);
  const dirty = draftPerms !== null || draftGlobal !== null;

  const byModulo = useMemo(() => {
    const acc: Record<string, Permiso[]> = {};
    for (const p of permisos) (acc[p.modulo] ||= []).push(p);
    return acc;
  }, [permisos]);

  const saveMut = useMutation({
    mutationFn: () =>
      adminPatchRol(rol.id_rol, {
        permisos: [...checked],
        acceso_global: accesoGlobal,
      }),
    onSuccess: () => {
      toast.success("Permisos guardados");
      setDraftPerms(null);
      setDraftGlobal(null);
      qc.invalidateQueries({ queryKey: ["ecom-roles", tid] });
    },
    onError: (e: Error) => toast.error(e.message || "Error"),
  });

  const setChecked = (next: Set<string>) => setDraftPerms([...next]);

  const toggle = (codigo: string) => {
    const next = new Set(checked);
    if (next.has(codigo)) next.delete(codigo);
    else next.add(codigo);
    setChecked(next);
  };

  const toggleModulo = (list: Permiso[], allOn: boolean) => {
    const next = new Set(checked);
    for (const p of list) {
      if (allOn) next.delete(p.codigo);
      else next.add(p.codigo);
    }
    setChecked(next);
  };

  const total = permisos.length;
  const activos = permisos.filter((p) => checked.has(p.codigo)).length;

  return (
    <div className="space-y-5 max-w-5xl pb-24 md:pb-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Roles</h1>
        <p className="text-stone-500 text-sm mt-1">
          Qué puede hacer cada tipo de usuario en la tienda.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-stone-400">Cargando…</p>
      ) : !rol ? (
        <p className="text-sm text-stone-400">No hay roles.</p>
      ) : (
        <div className="grid md:grid-cols-[16rem_1fr] gap-4 items-start">
          <div className="md:hidden">
            <Select
              value={String(rol.id_rol)}
              onValueChange={(v) => setSelected(Number(v))}
            >
              <SelectTrigger className="min-h-12 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.id_rol} value={String(r.id_rol)}>
                    {r.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <nav className="hidden md:flex flex-col gap-1 rounded-xl border border-stone-200 bg-white p-2">
            {roles.map((r) => (
              <button
                key={r.id_rol}
                type="button"
                onClick={() => setSelected(r.id_rol)}
                className={cn(
                  "w-full text-left rounded-lg px-3 py-2.5 min-h-11 text-sm transition",
                  rol.id_rol === r.id_rol
                    ? "bg-stone-900 text-white"
                    : "text-stone-700 hover:bg-stone-100"
                )}
              >
                <span className="block font-medium">{r.nombre}</span>
                {ROL_HINT[r.codigo] && (
                  <span
                    className={cn(
                      "block text-[11px] mt-0.5 leading-snug",
                      rol.id_rol === r.id_rol ? "text-white/70" : "text-stone-400"
                    )}
                  >
                    {ROL_HINT[r.codigo]}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="space-y-4">
            <div className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-lg leading-tight">{rol.nombre}</p>
                  <p className="text-sm text-stone-500 mt-0.5">
                    {ROL_HINT[rol.codigo] || "Permisos de este rol"}
                    {" · "}
                    {activos} de {total} permisos
                  </p>
                </div>
              </div>
              <label className="flex items-start gap-3 rounded-xl border border-stone-100 bg-stone-50/80 px-3 py-3 min-h-11">
                <Switch
                  className="mt-0.5"
                  checked={accesoGlobal}
                  onCheckedChange={(v) => setDraftGlobal(v)}
                />
                <span className="text-sm">
                  <span className="font-medium block">Ve todas las sucursales</span>
                  <span className="text-stone-500 text-xs">
                    Si lo apagas, a cada usuario de este rol hay que asignarle sucursal en Usuarios.
                  </span>
                </span>
              </label>
            </div>

            {SECTIONS.map((sec) => {
              const groups = sec.modulos
                .map((mod) => ({ mod, list: byModulo[mod] || [] }))
                .filter((g) => g.list.length);
              if (!groups.length) return null;
              return (
                <section key={sec.label} className="space-y-2">
                  <div>
                    <h2 className="text-sm font-semibold text-stone-800">{sec.label}</h2>
                    <p className="text-xs text-stone-400">{sec.hint}</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {groups.map(({ mod, list }) => {
                      const onCount = list.filter((p) => checked.has(p.codigo)).length;
                      const allOn = onCount === list.length;
                      return (
                        <div
                          key={mod}
                          className="rounded-xl border border-stone-200 bg-white p-3 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium">{mod}</p>
                            <button
                              type="button"
                              className="text-xs text-teal-700 hover:underline min-h-8 px-1"
                              onClick={() => toggleModulo(list, allOn)}
                            >
                              {allOn ? "Quitar todo" : "Marcar todo"}
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {list.map((p) => {
                              const on = checked.has(p.codigo);
                              return (
                                <button
                                  key={p.codigo}
                                  type="button"
                                  onClick={() => toggle(p.codigo)}
                                  className={cn(
                                    "inline-flex items-center min-h-11 px-3 rounded-full border text-sm touch-manipulation",
                                    on
                                      ? "border-teal-600 bg-teal-50 text-teal-800"
                                      : "border-stone-200 text-stone-500"
                                  )}
                                >
                                  {ACCION_LABEL[p.accion] || p.accion}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}

            {permisos.some((p) => !SECTIONS.some((s) => s.modulos.includes(p.modulo))) && (
              <section className="space-y-2">
                <h2 className="text-sm font-semibold">Otros</h2>
                <div className="flex flex-wrap gap-1.5">
                  {permisos
                    .filter((p) => !SECTIONS.some((s) => s.modulos.includes(p.modulo)))
                    .map((p) => (
                      <button
                        key={p.codigo}
                        type="button"
                        onClick={() => toggle(p.codigo)}
                        className={cn(
                          "inline-flex min-h-11 px-3 rounded-full border text-sm",
                          checked.has(p.codigo)
                            ? "border-teal-600 bg-teal-50 text-teal-800"
                            : "border-stone-200 text-stone-500"
                        )}
                      >
                        {p.modulo} · {ACCION_LABEL[p.accion] || p.accion}
                      </button>
                    ))}
                </div>
              </section>
            )}
          </div>
        </div>
      )}

      {rol && (
        <div className="fixed md:static bottom-0 inset-x-0 z-20 border-t md:border-0 border-stone-200 bg-white/95 md:bg-transparent backdrop-blur md:backdrop-blur-none p-3 md:p-0 md:flex md:justify-end">
          <div className="max-w-5xl mx-auto flex items-center justify-between md:justify-end gap-3">
            <p className="text-xs text-stone-400 md:hidden">
              {dirty ? "Hay cambios sin guardar" : "Todo guardado"}
            </p>
            <Button
              type="button"
              className="min-h-11 w-full md:w-auto"
              disabled={!dirty || saveMut.isPending}
              onClick={() => saveMut.mutate()}
            >
              <Shield className="size-4 mr-1.5" />
              {saveMut.isPending ? "Guardando…" : "Guardar permisos"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
