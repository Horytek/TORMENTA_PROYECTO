import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, Link as LinkIcon, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { isActiveInClientV2 } from "@/lib/navigationCatalog";
import { getIcon } from "@/lib/iconRegistry";

import { ModuloFormDialog } from "./ModuloFormDialog";
import { SubmoduloFormDialog } from "./SubmoduloFormDialog";
import { getModulos, deleteModulo, deleteSubmodulo, setModuloVisibility, setSubmoduloVisibility } from "../api/developer";
import type { Modulo, Submodulo } from "../types";

export function ModulosTab() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["developer-modulos"], queryFn: getModulos });
  const modulos = data?.modulos ?? [];
  const submodulos = data?.submodulos ?? [];

  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const [moduloDialog, setModuloDialog] = useState<{ open: boolean; modulo: Modulo | null }>({ open: false, modulo: null });
  const [submoduloDialog, setSubmoduloDialog] = useState<{ open: boolean; parent: Modulo | null; submodulo: Submodulo | null }>({ open: false, parent: null, submodulo: null });
  const [deleteModuloTarget, setDeleteModuloTarget] = useState<Modulo | null>(null);
  const [deleteSubTarget, setDeleteSubTarget] = useState<Submodulo | null>(null);

  const deleteModuloMutation = useMutation({
    mutationFn: (m: Modulo) => deleteModulo(m.id_modulo),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["developer-modulos"] }); setDeleteModuloTarget(null); },
  });
  const deleteSubMutation = useMutation({
    mutationFn: (s: Submodulo) => deleteSubmodulo(s.id_submodulo),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["developer-modulos"] }); setDeleteSubTarget(null); },
  });
  const toggleModuloVisMutation = useMutation({
    mutationFn: (m: Modulo) => setModuloVisibility(m, !m.is_visible),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["developer-modulos"] }),
  });
  const toggleSubVisMutation = useMutation({
    mutationFn: (s: Submodulo) => setSubmoduloVisibility(s, !s.is_visible),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["developer-modulos"] }),
  });

  // Solo módulos con pantalla real en client-v2 (o que tengan al menos un
  // submódulo con pantalla) — el resto es legacy del frontend anterior, que ya
  // no se piensa usar, así que no tiene sentido seguir gestionándolo acá.
  const filteredModulos = useMemo(() => {
    const q = search.trim().toLowerCase();
    return modulos
      .filter((m) => isActiveInClientV2(m.ruta, m) || submodulos.some((s) => s.id_modulo === m.id_modulo && isActiveInClientV2(s.ruta_submodulo, s)))
      .filter((m) => !q || m.nombre_modulo.toLowerCase().includes(q) || m.ruta.toLowerCase().includes(q));
  }, [modulos, submodulos, search]);

  const getSubsFor = (idModulo: number) => submodulos.filter((s) => s.id_modulo === idModulo && isActiveInClientV2(s.ruta_submodulo, s));

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar módulo…"
          className="h-9 max-w-sm"
        />
        <Button size="sm" className="gap-1.5" onClick={() => setModuloDialog({ open: true, modulo: null })}>
          <Plus className="h-4 w-4" /> Nuevo módulo
        </Button>
      </div>

      <div className="rounded-xl border border-border">
        {filteredModulos.map((modulo) => {
          const subs = getSubsFor(modulo.id_modulo);
          const isOpen = !!expanded[modulo.id_modulo] || !!search;
          return (
            <div key={modulo.id_modulo} className="border-b border-border/60 last:border-0">
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <button
                  type="button"
                  className="flex flex-1 items-center gap-2 text-left cursor-pointer"
                  onClick={() => setExpanded((prev) => ({ ...prev, [modulo.id_modulo]: !prev[modulo.id_modulo] }))}
                >
                  {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  {(() => { const Icon = getIcon(modulo.icon); return <Icon className="h-4 w-4 text-muted-foreground" />; })()}
                  <span className={`font-semibold ${modulo.is_visible === false ? "text-muted-foreground line-through" : "text-foreground"}`}>{modulo.nombre_modulo}</span>
                  <span className="flex items-center gap-1 rounded bg-muted/50 px-2 py-0.5 font-mono text-xs text-muted-foreground">
                    <LinkIcon className="h-3 w-3" /> {modulo.ruta}
                  </span>
                </button>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    title={modulo.is_visible === false ? "Mostrar en el menú" : "Ocultar del menú"}
                    onClick={() => toggleModuloVisMutation.mutate(modulo)}
                  >
                    {modulo.is_visible === false ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => setSubmoduloDialog({ open: true, parent: modulo, submodulo: null })}>
                    <Plus className="h-3.5 w-3.5" /> Submódulo
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setModuloDialog({ open: true, modulo })}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => setDeleteModuloTarget(modulo)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {isOpen && (
                <div className="space-y-0.5 bg-muted/10 pb-2">
                  {subs.length === 0 ? (
                    <p className="px-4 py-2 pl-11 text-xs italic text-muted-foreground">Sin submódulos asignados</p>
                  ) : (
                    subs.map((sub) => (
                      <div key={sub.id_submodulo} className="flex items-center justify-between gap-3 px-4 py-2 pl-11">
                        <div className="flex items-center gap-2 text-sm">
                          {(() => { const Icon = getIcon(sub.icon); return <Icon className="h-3.5 w-3.5 text-muted-foreground" />; })()}
                          <span className={sub.is_visible === false ? "text-muted-foreground line-through" : "text-foreground"}>{sub.nombre_sub}</span>
                          <span className="flex items-center gap-1 rounded bg-muted/50 px-2 py-0.5 font-mono text-xs text-muted-foreground">
                            <LinkIcon className="h-3 w-3" /> {sub.ruta_submodulo}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            title={sub.is_visible === false ? "Mostrar en el menú" : "Ocultar del menú"}
                            onClick={() => toggleSubVisMutation.mutate(sub)}
                          >
                            {sub.is_visible === false ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" /> : <Eye className="h-3.5 w-3.5" />}
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setSubmoduloDialog({ open: true, parent: modulo, submodulo: sub })}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => setDeleteSubTarget(sub)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
        {filteredModulos.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">No se encontraron módulos.</p>
        )}
      </div>

      <ModuloFormDialog isOpen={moduloDialog.open} onClose={() => setModuloDialog({ open: false, modulo: null })} modulo={moduloDialog.modulo} />
      <SubmoduloFormDialog
        isOpen={submoduloDialog.open}
        onClose={() => setSubmoduloDialog({ open: false, parent: null, submodulo: null })}
        parentModulo={submoduloDialog.parent}
        submodulo={submoduloDialog.submodulo}
      />

      <ConfirmDialog
        open={!!deleteModuloTarget}
        onClose={() => setDeleteModuloTarget(null)}
        onConfirm={() => deleteModuloTarget && deleteModuloMutation.mutate(deleteModuloTarget)}
        title="¿Eliminar este módulo?"
        description={`Se eliminará "${deleteModuloTarget?.nombre_modulo}" y afectará el menú de navegación.`}
        confirmLabel="Eliminar"
        variant="danger"
        isPending={deleteModuloMutation.isPending}
      />
      <ConfirmDialog
        open={!!deleteSubTarget}
        onClose={() => setDeleteSubTarget(null)}
        onConfirm={() => deleteSubTarget && deleteSubMutation.mutate(deleteSubTarget)}
        title="¿Eliminar este submódulo?"
        description={`Se eliminará "${deleteSubTarget?.nombre_sub}".`}
        confirmLabel="Eliminar"
        variant="danger"
        isPending={deleteSubMutation.isPending}
      />
    </div>
  );
}
