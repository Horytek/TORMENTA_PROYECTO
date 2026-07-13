import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

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
  label: string;
  sub: boolean;
  active: Set<string> | null; // null = todas las acciones permitidas
}

const parseActive = (a: unknown): Set<string> | null => {
  if (a == null) return null;
  if (Array.isArray(a)) return new Set(a as string[]);
  if (typeof a === "string") {
    try {
      const arr = JSON.parse(a);
      return Array.isArray(arr) ? new Set(arr) : null;
    } catch {
      return null;
    }
  }
  return null;
};

const rowKey = (idModulo: number, idSub: number | null) => `${idModulo}:${idSub ?? "m"}`;

interface Props {
  role: Rol;
  open: boolean;
  onClose: () => void;
}

export default function RolePermissionsDialog({ role, open, onClose }: Props) {
  const queryClient = useQueryClient();
  const [perms, setPerms] = useState<Record<string, Flags>>({});

  const { data: modules = [], isLoading: loadingModules } = useQuery({
    queryKey: ["modulos-permisos"],
    queryFn: getModulosConSubmodulos,
    enabled: open,
  });

  const { data: current = [], isLoading: loadingPermisos } = useQuery({
    queryKey: ["permisos-rol", role.id_rol],
    queryFn: () => getPermisosByRol(role.id_rol),
    enabled: open,
  });

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    for (const m of modules) {
      out.push({ key: rowKey(m.id, null), id_modulo: m.id, id_submodulo: null, label: m.nombre, sub: false, active: parseActive(m.active_actions) });
      for (const s of m.submodulos) {
        out.push({ key: rowKey(m.id, s.id_submodulo), id_modulo: m.id, id_submodulo: s.id_submodulo, label: s.nombre_sub, sub: true, active: parseActive(s.active_actions) });
      }
    }
    return out;
  }, [modules]);

  // Inicializa el estado desde los permisos actuales del rol.
  useEffect(() => {
    if (!open) return;
    const map: Record<string, Flags> = {};
    for (const p of current) {
      map[rowKey(p.id_modulo, p.id_submodulo ?? null)] = {
        ver: p.ver ? 1 : 0,
        crear: p.crear ? 1 : 0,
        editar: p.editar ? 1 : 0,
        eliminar: p.eliminar ? 1 : 0,
        desactivar: p.desactivar ? 1 : 0,
        generar: p.generar ? 1 : 0,
      };
    }
    setPerms(map);
  }, [current, open]);

  const toggle = (key: string, action: ActionKey) =>
    setPerms((prev) => {
      const row = prev[key] ?? ZERO;
      return { ...prev, [key]: { ...row, [action]: row[action] ? 0 : 1 } };
    });

  const mutation = useMutation({
    mutationFn: () => {
      const payload: PermisoRow[] = [];
      for (const r of rows) {
        const f = perms[r.key] ?? ZERO;
        if (f.ver || f.crear || f.editar || f.eliminar || f.desactivar || f.generar) {
          payload.push({ id_modulo: r.id_modulo, id_submodulo: r.id_submodulo, ...f });
        }
      }
      return savePermisos(role.id_rol, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permisos-rol", role.id_rol] });
      onClose();
    },
  });

  const loading = loadingModules || loadingPermisos;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Permisos · <span className="capitalize">{role.nom_rol}</span>
          </DialogTitle>
          <DialogDescription className="text-sm">
            Marca las acciones permitidas para cada módulo. Las acciones no disponibles en un
            módulo aparecen deshabilitadas.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-muted">
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Módulo
                  </th>
                  {ACTIONS.map((a) => (
                    <th key={a.key} className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {a.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const f = perms[r.key] ?? ZERO;
                  return (
                    <tr key={r.key} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                      <td className={cn("px-3 py-1.5", r.sub ? "pl-8 text-muted-foreground" : "font-medium text-foreground")}>
                        {r.sub ? `· ${r.label}` : r.label}
                      </td>
                      {ACTIONS.map((a) => {
                        const allowed = r.active === null || r.active.has(a.key);
                        return (
                          <td key={a.key} className="px-2 py-1.5 text-center">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={!!f[a.key]}
                                disabled={!allowed}
                                onCheckedChange={() => toggle(r.key, a.key)}
                                aria-label={`${a.label} ${r.label}`}
                              />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {mutation.isError && (
          <p className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            No se pudieron guardar los permisos. Intenta de nuevo.
          </p>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || loading}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar permisos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
