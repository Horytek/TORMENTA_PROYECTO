import { Fragment, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldCheck } from "lucide-react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getIcon } from "@/lib/iconRegistry";
import { SECTION_ORDER, getModuleMeta, type ModuleMeta } from "@/lib/navigationCatalog";

import { getPlanesDisponibles } from "../api/permissionsAudit";
import { getCatalogByPlan, getAdminPermisosByPlan, saveAdminPermisosByPlan, type AdminPermisoRow } from "../api/adminPlanPermissions";

type ActionKey = "ver" | "crear" | "editar" | "eliminar" | "desactivar" | "generar";
type Flags = Record<ActionKey, number>;

const ACTIONS: { key: ActionKey; label: string }[] = [
  { key: "ver", label: "Ver" },
  { key: "crear", label: "Crear" },
  { key: "editar", label: "Editar" },
  { key: "eliminar", label: "Eliminar" },
  { key: "desactivar", label: "Desact." },
  { key: "generar", label: "Generar" },
];

const ZERO: Flags = { ver: 0, crear: 0, editar: 0, eliminar: 0, desactivar: 0, generar: 0 };

interface Row {
  key: string;
  id_modulo: number;
  id_submodulo: number | null;
  ruta: string;
  nombre: string;
  icon?: string | null;
  group: string;
  active: Set<string> | null;
  meta?: ModuleMeta;
}

const parseActive = (a: unknown): Set<string> | null => {
  if (a == null) return null;
  if (Array.isArray(a)) return new Set(a as string[]);
  if (typeof a === "string") {
    try { const arr = JSON.parse(a); return Array.isArray(arr) ? new Set(arr) : null; } catch { return null; }
  }
  return null;
};

const rowKey = (idModulo: number, idSub: number | null) => `${idModulo}:${idSub ?? "m"}`;
const allowed = (row: Row, action: ActionKey) => row.active === null || row.active.has(action);

/**
 * Permisos del Administrador/titular por PLAN (enterprise/pro/basic) — solo
 * Developer. Distinto de "Entitlements por Plan" (qué módulos existen para el
 * plan): esto define QUÉ PUEDE HACER el rol Administrador (ver/crear/editar/...)
 * en cada módulo entitled, y se empuja como default a todos los tenants de ese
 * plan (tabla `permisos`, id_plan = plan). Un tenant puede seguir teniendo sus
 * propios overrides (id_plan NULL) que siguen ganando sobre este default — ver
 * AuthZService.getEffectivePermissions. Los roles que no son Administrador
 * (Empleados, Supervisor, etc.) se siguen gestionando desde el tenant (Roles y
 * Permisos), no acá.
 */
export function AdminPlanPermissionsTab() {
  const queryClient = useQueryClient();
  const { data: planes = [] } = useQuery({ queryKey: ["dev-admin-perms-planes"], queryFn: getPlanesDisponibles });
  const [planId, setPlanId] = useState<string>("");
  const [perms, setPerms] = useState<Record<string, Flags>>({});

  useEffect(() => {
    if (!planId && planes.length > 0) setPlanId(String(planes[0].id_plan));
  }, [planes, planId]);

  const { data: catalog = [], isLoading: loadingCatalog } = useQuery({
    queryKey: ["dev-admin-perms-catalog", planId],
    queryFn: () => getCatalogByPlan(Number(planId)),
    enabled: !!planId,
  });

  const { data: current, isLoading: loadingCurrent } = useQuery({
    queryKey: ["dev-admin-perms-current", planId],
    queryFn: () => getAdminPermisosByPlan(Number(planId)),
    enabled: !!planId,
  });

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    for (const m of catalog) {
      out.push({
        key: rowKey(m.id, null), id_modulo: m.id, id_submodulo: null,
        ruta: m.ruta ?? "",
        nombre: m.nombre, icon: m.icon, group: m.group_name || "General",
        active: parseActive(m.active_actions),
        meta: getModuleMeta(m.ruta, m),
      });
      for (const s of m.submodulos) {
        out.push({
          key: rowKey(m.id, s.id_submodulo), id_modulo: m.id, id_submodulo: s.id_submodulo,
          ruta: s.ruta ?? "",
          nombre: s.nombre_sub, icon: s.icon, group: s.group_name || m.group_name || "General",
          active: parseActive(s.active_actions),
          meta: getModuleMeta(s.ruta, s),
        });
      }
    }
    return out;
  }, [catalog]);

  // Mapa de URL de client-v2 → la clave de fila (rowKey) primaria para evitar duplicados visuales
  const urlToPrimaryRowKey = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rows) {
      if (r.meta?.url) {
        if (!map.has(r.meta.url)) {
          map.set(r.meta.url, r.key);
        }
      }
    }
    return map;
  }, [rows]);

  // Solo módulos con pantalla real en client-v2, agrupados y ordenados igual que el sidebar
  const displayRows = useMemo(() => {
    return rows.filter((r): r is Row & { meta: ModuleMeta } => {
      if (!r.meta) return false;
      if (urlToPrimaryRowKey.get(r.meta.url) !== r.key) return false;
      return true;
    });
  }, [rows, urlToPrimaryRowKey]);

  useEffect(() => {
    if (!current) return;
    const map: Record<string, Flags> = {};
    for (const p of current) {
      const origKey = rowKey(p.id_modulo, p.id_submodulo ?? null);
      const matchingRow = rows.find(r => r.key === origKey);
      const targetKey = (matchingRow?.meta?.url && urlToPrimaryRowKey.get(matchingRow.meta.url)) || origKey;

      const prevFlags = map[targetKey] ?? ZERO;
      map[targetKey] = {
        ver: (p.ver || prevFlags.ver) ? 1 : 0,
        crear: (p.crear || prevFlags.crear) ? 1 : 0,
        editar: (p.editar || prevFlags.editar) ? 1 : 0,
        eliminar: (p.eliminar || prevFlags.eliminar) ? 1 : 0,
        desactivar: (p.desactivar || prevFlags.desactivar) ? 1 : 0,
        generar: (p.generar || prevFlags.generar) ? 1 : 0,
      };
    }
    setPerms(map);
  }, [current, rows, urlToPrimaryRowKey]);

  const groupedRows = useMemo(() => {
    const byGroup = new Map<string, (Row & { meta: ModuleMeta })[]>();
    for (const r of displayRows) {
      const list = byGroup.get(r.meta.group) ?? [];
      list.push(r);
      byGroup.set(r.meta.group, list);
    }
    return SECTION_ORDER
      .map((group) => ({ group, items: byGroup.get(group) ?? [] }))
      .filter((g) => g.items.length > 0);
  }, [displayRows]);

  const flagsOf = (key: string) => perms[key] ?? ZERO;
  const setFlag = (key: string, action: ActionKey, on: boolean) =>
    setPerms((prev) => ({ ...prev, [key]: { ...(prev[key] ?? ZERO), [action]: on ? 1 : 0 } }));

  const toggleRowAll = (row: Row) => {
    const acts = ACTIONS.filter((a) => allowed(row, a.key));
    const allOn = acts.every((a) => flagsOf(row.key)[a.key]);
    setPerms((prev) => {
      const cur = { ...(prev[row.key] ?? ZERO) };
      for (const a of acts) cur[a.key] = allOn ? 0 : 1;
      return { ...prev, [row.key]: cur };
    });
  };

  const colState = (action: ActionKey) => {
    const elig = displayRows.filter((r) => allowed(r, action));
    const on = elig.filter((r) => flagsOf(r.key)[action]).length;
    return { total: elig.length, on, all: elig.length > 0 && on === elig.length };
  };
  const toggleColAll = (action: ActionKey) => {
    const { all } = colState(action);
    setPerms((prev) => {
      const next = { ...prev };
      for (const r of displayRows) {
        if (!allowed(r, action)) continue;
        next[r.key] = { ...(next[r.key] ?? ZERO), [action]: all ? 0 : 1 };
      }
      return next;
    });
  };

  const mutation = useMutation({
    mutationFn: () => {
      const payload: AdminPermisoRow[] = [];
      for (const r of rows) {
        if (r.meta?.url && urlToPrimaryRowKey.get(r.meta.url) !== r.key) {
          continue;
        }
        const f = flagsOf(r.key);
        if (f.ver || f.crear || f.editar || f.eliminar || f.desactivar || f.generar) {
          payload.push({ id_modulo: r.id_modulo, id_submodulo: r.id_submodulo, ...f });
        }
      }
      return saveAdminPermisosByPlan(Number(planId), payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dev-admin-perms-current", planId] }),
  });

  const loading = loadingCatalog || loadingCurrent;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
        <ShieldCheck className="h-5 w-5 text-brand" />
        <div className="flex-1 min-w-[240px]">
          <p className="text-sm font-semibold text-foreground">Permisos del Administrador por plan</p>
          <p className="text-xs text-muted-foreground">
            Define qué puede hacer el titular (rol Administrador) en cada módulo de este plan — se aplica a todos los tenants
            suscritos a él. Un tenant conserva sus propios ajustes si ya los personalizó desde "Roles y Permisos".
          </p>
        </div>
        <Select value={planId} onValueChange={setPlanId}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Plan" /></SelectTrigger>
          <SelectContent>
            {planes.map((p) => (
              <SelectItem key={p.id_plan} value={String(p.id_plan)}>{p.descripcion_plan}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
        </div>
      ) : (
        <>
          <div className="max-h-[55vh] overflow-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-muted">
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Módulo</th>
                  {ACTIONS.map((a) => {
                    const c = colState(a.key);
                    return (
                      <th key={a.key} className="px-2 py-1.5 text-center">
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => toggleColAll(a.key)}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleColAll(a.key); } }}
                          className="mx-auto flex flex-col items-center gap-1 rounded px-1.5 py-0.5 hover:bg-background cursor-pointer select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{a.label}</span>
                          <Checkbox checked={c.all} className="pointer-events-none h-3.5 w-3.5" />
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {groupedRows.map(({ group, items }) => (
                  <Fragment key={group}>
                    <tr className="bg-muted/40">
                      <td colSpan={7} className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {group}
                      </td>
                    </tr>
                    {items.map((r) => {
                      const f = flagsOf(r.key);
                      const Icon = r.meta.icon;
                      return (
                        <tr key={r.key} className="border-b border-border/60 last:border-0">
                          <td className="px-3 py-1.5 font-medium">
                            <button
                              type="button"
                              onClick={() => toggleRowAll(r)}
                              className="flex items-center gap-2 truncate rounded px-1 py-0.5 text-left text-foreground hover:bg-accent"
                              title="Marcar/desmarcar toda la fila"
                            >
                              <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              {r.meta.title}
                            </button>
                          </td>
                          {ACTIONS.map((a) => (
                            <td key={a.key} className="px-2 py-1.5 text-center">
                              <div className="flex justify-center">
                                <Checkbox
                                  checked={!!f[a.key]}
                                  disabled={!allowed(r, a.key)}
                                  onCheckedChange={(v) => setFlag(r.key, a.key, !!v)}
                                  aria-label={`${a.label} ${r.meta.title}`}
                                />
                              </div>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </Fragment>
                ))}
                {displayRows.length === 0 && (
                  <tr><td colSpan={7} className="px-3 py-8 text-center text-sm text-muted-foreground">Este plan no tiene módulos entitled todavía.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {mutation.isError && (
            <p className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              No se pudieron guardar los permisos. Intenta de nuevo.
            </p>
          )}
          {mutation.isSuccess && !mutation.isPending && (
            <p className="rounded-md border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
              Permisos del Administrador actualizados para todos los tenants de este plan.
            </p>
          )}

          <div className="flex justify-end">
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !planId}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar permisos del plan
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
