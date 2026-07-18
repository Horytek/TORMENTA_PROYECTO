import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FilePlus2, Rocket, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

import {
  getPlanes, getModulos, listPlanVersions, getPlanEntitlements,
  createPlanDraft, savePlanEntitlements, publishPlanVersion, discardPlanDraft,
} from "../api/developer";
import type { PlanEntitlements } from "../types";

const STATUS_LABEL: Record<string, { label: string; variant: "success" | "secondary" | "outline" }> = {
  PUBLISHED: { label: "Publicada", variant: "success" },
  DRAFT: { label: "Borrador", variant: "secondary" },
  ARCHIVED: { label: "Archivada", variant: "outline" },
};

export function PlanEntitlementsTab() {
  const queryClient = useQueryClient();
  const { data: planes = [], isLoading: loadingPlanes } = useQuery({ queryKey: ["developer-planes"], queryFn: getPlanes });
  const { data: catalogo, isLoading: loadingCatalogo } = useQuery({ queryKey: ["developer-modulos"], queryFn: getModulos });

  const [idPlan, setIdPlan] = useState<number | null>(null);
  const [pendingEntitlements, setPendingEntitlements] = useState<PlanEntitlements | null>(null);
  const [discardTarget, setDiscardTarget] = useState<number | null>(null);

  const { data: versions = [], isLoading: loadingVersions } = useQuery({
    queryKey: ["plan-versions", idPlan],
    queryFn: () => listPlanVersions(idPlan!),
    enabled: idPlan != null,
  });

  const draft = versions.find((v) => v.status === "DRAFT");
  const published = versions.find((v) => v.status === "PUBLISHED");
  const editingVersion = draft;

  const { data: entitlements, isLoading: loadingEntitlements } = useQuery({
    queryKey: ["plan-entitlements", editingVersion?.id],
    queryFn: () => getPlanEntitlements(editingVersion!.id),
    enabled: editingVersion != null,
  });

  const current = pendingEntitlements ?? entitlements ?? { modulos: [], submodulos: [] };

  const createDraftMutation = useMutation({
    mutationFn: () => createPlanDraft(idPlan!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["plan-versions", idPlan] }),
  });
  const saveMutation = useMutation({
    mutationFn: () => savePlanEntitlements(editingVersion!.id, current),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plan-entitlements", editingVersion?.id] });
      setPendingEntitlements(null);
    },
  });
  const publishMutation = useMutation({
    mutationFn: () => publishPlanVersion(editingVersion!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plan-versions", idPlan] });
      setPendingEntitlements(null);
    },
  });
  const discardMutation = useMutation({
    mutationFn: (id: number) => discardPlanDraft(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plan-versions", idPlan] });
      setPendingEntitlements(null);
      setDiscardTarget(null);
    },
  });

  const toggleModulo = (idModulo: number, checked: boolean) => {
    const base = current;
    const modulos = checked ? [...new Set([...base.modulos, idModulo])] : base.modulos.filter((id) => id !== idModulo);
    setPendingEntitlements({ ...base, modulos });
  };
  const toggleSubmodulo = (idSubmodulo: number, checked: boolean) => {
    const base = current;
    const submodulos = checked ? [...new Set([...base.submodulos, idSubmodulo])] : base.submodulos.filter((id) => id !== idSubmodulo);
    setPendingEntitlements({ ...base, submodulos });
  };

  const modulos = catalogo?.modulos ?? [];
  const submodulos = catalogo?.submodulos ?? [];
  const hasChanges = pendingEntitlements != null;

  const isLoading = loadingPlanes || loadingCatalogo;

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Qué módulos/submódulos incluye cada plan (E4: plantillas versionadas). Publicar una versión no borra los overrides
        que ya tenga un tenant — solo cambia el default sobre el que se calculan sus permisos.
      </p>

      <div className="flex items-center gap-3">
        <Select value={idPlan?.toString()} onValueChange={(v) => { setIdPlan(Number(v)); setPendingEntitlements(null); }}>
          <SelectTrigger className="max-w-xs">
            <SelectValue placeholder="Selecciona un plan" />
          </SelectTrigger>
          <SelectContent>
            {planes.map((p) => (
              <SelectItem key={p.id_plan} value={p.id_plan.toString()}>{p.descripcion_plan}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {published && <Badge variant={STATUS_LABEL[published.status].variant}>Publicada: v{published.version}</Badge>}
        {draft && <Badge variant={STATUS_LABEL[draft.status].variant}>Borrador: v{draft.version}</Badge>}
      </div>

      {idPlan == null ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Selecciona un plan para ver sus entitlements.</p>
      ) : loadingVersions ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : !draft ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-10">
          <p className="text-sm text-muted-foreground">
            {published ? "No hay borrador. Crea uno para editar los entitlements (se copian los de la versión publicada)." : "Este plan no tiene ninguna versión todavía."}
          </p>
          <Button size="sm" className="gap-1.5" onClick={() => createDraftMutation.mutate()} disabled={createDraftMutation.isPending}>
            <FilePlus2 className="h-4 w-4" /> Crear borrador
          </Button>
        </div>
      ) : loadingEntitlements ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <>
          <div className="rounded-xl border border-border">
            {modulos.map((modulo) => {
              const subs = submodulos.filter((s) => s.id_modulo === modulo.id_modulo);
              const moduloChecked = current.modulos.includes(modulo.id_modulo);
              return (
                <div key={modulo.id_modulo} className="border-b border-border/60 px-4 py-2 last:border-0">
                  <label className="flex items-center gap-2 py-1.5">
                    <Checkbox checked={moduloChecked} onCheckedChange={(c) => toggleModulo(modulo.id_modulo, !!c)} />
                    <span className="text-sm font-medium text-foreground">{modulo.nombre_modulo}</span>
                    <span className="font-mono text-xs text-muted-foreground">{modulo.ruta}</span>
                  </label>
                  {subs.length > 0 && (
                    <div className="ml-6 space-y-1 border-l border-border/60 pl-4">
                      {subs.map((sub) => (
                        <label key={sub.id_submodulo} className="flex items-center gap-2 py-1">
                          <Checkbox
                            checked={current.submodulos.includes(sub.id_submodulo)}
                            onCheckedChange={(c) => toggleSubmodulo(sub.id_submodulo, !!c)}
                          />
                          <span className="text-sm text-foreground">{sub.nombre_sub}</span>
                          <span className="font-mono text-xs text-muted-foreground">{sub.ruta_submodulo}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-destructive hover:text-destructive"
              onClick={() => setDiscardTarget(editingVersion!.id)}
            >
              <Trash2 className="h-4 w-4" /> Descartar borrador
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={!hasChanges || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
                Guardar borrador
              </Button>
              <Button
                size="sm"
                className="gap-1.5"
                disabled={hasChanges || publishMutation.isPending}
                onClick={() => publishMutation.mutate()}
                title={hasChanges ? "Guarda los cambios antes de publicar" : undefined}
              >
                <Rocket className="h-4 w-4" /> Publicar
              </Button>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={discardTarget != null}
        onClose={() => setDiscardTarget(null)}
        onConfirm={() => discardTarget != null && discardMutation.mutate(discardTarget)}
        title="¿Descartar este borrador?"
        description="Se pierden los cambios sin publicar. La versión publicada actual no se ve afectada."
        confirmLabel="Descartar"
        variant="danger"
        isPending={discardMutation.isPending}
      />
    </div>
  );
}
