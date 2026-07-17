import { Fragment, useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, ShieldCheck } from "lucide-react";
import { getModuleMeta, SECTION_ORDER, type ModuleMeta } from "@/lib/navigationCatalog";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { getModulosConSubmodulos } from "@/api/rutas";
import { getPermisosByRol, savePermisos, type PermisoRow } from "../api/permisos";
import type { Rol } from "../types";

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
  active: Set<string> | null;
  /** Metadata del sidebar (grupo, título, ícono). Si no hay match, el módulo no tiene pantalla en client-v2. */
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

interface Props { role: Rol; open: boolean; onClose: () => void; }

export default function RolePermissionsDialog({ role, open, onClose }: Props) {
  const queryClient = useQueryClient();
  const [perms, setPerms] = useState<Record<string, Flags>>({});
  const [search, setSearch] = useState("");

  const { data: modules = [], isLoading: loadingModules } = useQuery({
    queryKey: ["modulos-permisos"],
    queryFn: getModulosConSubmodulos,
    enabled: open,
  });

  const { data: current, isLoading: loadingPermisos } = useQuery({
    queryKey: ["permisos-rol", role.id_rol],
    queryFn: () => getPermisosByRol(role.id_rol),
    enabled: open,
  });

  // Todas las filas de BD (incluye módulos legacy sin pantalla en client-v2) — se
  // conserva completa para no perder permisos ya otorgados sobre esos módulos al
  // guardar, aunque el diálogo ya no los muestre (ver `displayRows`).
  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    for (const m of modules) {
      out.push({ key: rowKey(m.id, null), id_modulo: m.id, id_submodulo: null, active: parseActive(m.active_actions), meta: getModuleMeta(m.ruta) });
      for (const s of m.submodulos) {
        out.push({ key: rowKey(m.id, s.id_submodulo), id_modulo: m.id, id_submodulo: s.id_submodulo, active: parseActive(s.active_actions), meta: getModuleMeta(s.ruta) });
      }
    }
    return out;
  }, [modules]);

  useEffect(() => {
    if (!open) {
      setPerms({});
      return;
    }
    if (!current) return;
    const map: Record<string, Flags> = {};
    for (const p of current) {
      map[rowKey(p.id_modulo, p.id_submodulo ?? null)] = {
        ver: p.ver ? 1 : 0, crear: p.crear ? 1 : 0, editar: p.editar ? 1 : 0,
        eliminar: p.eliminar ? 1 : 0, desactivar: p.desactivar ? 1 : 0, generar: p.generar ? 1 : 0,
      };
    }
    setPerms(map);
  }, [current, open, role.id_rol]);

  // Solo módulos con pantalla real en client-v2, agrupados y ordenados igual que
  // el sidebar (mismos nombres/grupos) — el resto (legacy) no se muestra ni se
  // puede tocar desde acá, ya no se piensa usar ese frontend.
  const displayRows = useMemo(() => {
    const q = search.toLowerCase().trim();
    return rows.filter((r): r is Row & { meta: ModuleMeta } => {
      if (!r.meta) return false;
      if (!q) return true;
      return r.meta.title!.toLowerCase().includes(q) || r.meta.group.toLowerCase().includes(q);
    });
  }, [rows, search]);

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

  const grantedModules = useMemo(
    () => displayRows.filter((r) => { const f = flagsOf(r.key); return f.ver || f.crear || f.editar || f.eliminar || f.desactivar || f.generar; }).length,
    [displayRows, perms] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const mutation = useMutation({
    mutationFn: () => {
      const payload: PermisoRow[] = [];
      for (const r of rows) {
        const f = flagsOf(r.key);
        if (f.ver || f.crear || f.editar || f.eliminar || f.desactivar || f.generar) {
          payload.push({ id_modulo: r.id_modulo, id_submodulo: r.id_submodulo, ...f });
        }
      }
      return savePermisos(role.id_rol, payload);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["permisos-rol", role.id_rol] }); onClose(); },
  });

  const loading = loadingModules || loadingPermisos;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand/10 text-brand ring-1 ring-brand/20">
              <ShieldCheck className="h-4 w-4" />
            </span>
            Permisos · <span className="capitalize">{role.nom_rol}</span>
          </DialogTitle>
          <DialogDescription className="text-sm">
            Marca las acciones por módulo — los mismos módulos y grupos del menú lateral. Usa las cabeceras para marcar una columna completa, o el nombre del módulo para marcar toda la fila.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar módulo…" className="h-9 pl-9" />
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="num font-semibold text-foreground">{grantedModules}</span> de {displayRows.length} con acceso
              </p>
            </div>

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
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                toggleColAll(a.key);
                              }
                            }}
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
                    <tr><td colSpan={7} className="px-3 py-8 text-center text-sm text-muted-foreground">Ningún módulo coincide con la búsqueda.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {mutation.isError && (
          <p className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {(() => {
              const err = mutation.error as { response?: { data?: { message?: string } }; message?: string } | null;
              const msg = err?.response?.data?.message ?? err?.message;
              return msg
                ? `No se pudieron guardar los permisos: ${msg}`
                : "No se pudieron guardar los permisos. Intenta de nuevo.";
            })()}
          </p>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>Cancelar</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || loading}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar permisos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
