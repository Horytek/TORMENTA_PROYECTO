import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, ChevronRight } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import {
  getPlanesDisponibles, getRolesPorPlan, getUnifiedCatalog,
  type MergedPermissionNode,
} from "../api/permissionsAudit";

const ACTION_LABELS: Record<string, string> = {
  ver: "Ver", crear: "Crear", editar: "Editar", eliminar: "Eliminar",
  desactivar: "Desactivar", generar: "Generar",
};

function PermissionRow({ node, depth = 0 }: { node: MergedPermissionNode; depth?: number }) {
  const granted = node.availableActions.filter((a) => node.permissions[a]);
  return (
    <div>
      <div
        className={cn(
          "flex flex-wrap items-center gap-2 border-b border-border/60 py-2.5",
          depth > 0 && "pl-6"
        )}
      >
        {depth > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />}
        <span className={cn("min-w-[180px] text-sm", depth === 0 ? "font-semibold text-foreground" : "text-muted-foreground")}>
          {node.name}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {node.availableActions.length === 0 && (
            <span className="text-xs text-muted-foreground/60">Sin acciones configuradas</span>
          )}
          {node.availableActions.map((action) => (
            <Badge
              key={action}
              variant={granted.includes(action) ? "success" : "outline"}
              className="text-[10px] font-normal"
            >
              {ACTION_LABELS[action] ?? action}
            </Badge>
          ))}
        </div>
      </div>
      {node.children?.map((child) => (
        <PermissionRow key={child.uniqueId} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

/**
 * Vista de solo lectura del árbol módulo→submódulo→acciones fusionado para
 * un rol + plan. Conecta `GET /permisos-globales/v2/unified-catalog`
 * (permissions.v2.controller.js) — ya existía en el backend pero ningún
 * frontend lo consumía. Útil para auditar qué puede hacer realmente un rol
 * sin tener que cruzar manualmente la matriz de permisos.
 */
export function PermissionsAuditTab() {
  const { data: planes = [] } = useQuery({ queryKey: ["dev-audit-planes"], queryFn: getPlanesDisponibles });
  const { data: roles = [] } = useQuery({ queryKey: ["dev-audit-roles"], queryFn: getRolesPorPlan });

  const [roleId, setRoleId] = useState<string>("");
  const [planId, setPlanId] = useState<string>("");

  useEffect(() => {
    if (!roleId && roles.length > 0) setRoleId(String(roles[0].id_rol));
  }, [roles, roleId]);
  useEffect(() => {
    if (!planId && planes.length > 0) setPlanId(String(planes[0].id_plan));
  }, [planes, planId]);

  const { data: tree = [], isFetching } = useQuery({
    queryKey: ["dev-audit-catalog", roleId, planId],
    queryFn: () => getUnifiedCatalog(Number(roleId), Number(planId)),
    enabled: !!roleId && !!planId,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
        <ShieldCheck className="h-5 w-5 text-brand" />
        <div className="flex-1 min-w-[200px]">
          <p className="text-sm font-semibold text-foreground">Auditoría de permisos</p>
          <p className="text-xs text-muted-foreground">Vista de solo lectura del catálogo módulo/submódulo fusionado con la matriz de permisos.</p>
        </div>
        <Select value={roleId} onValueChange={setRoleId}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Rol" /></SelectTrigger>
          <SelectContent>
            {roles.map((r) => (
              <SelectItem key={r.id_rol} value={String(r.id_rol)}>{r.nom_rol}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={planId} onValueChange={setPlanId}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Plan" /></SelectTrigger>
          <SelectContent>
            {planes.map((p) => (
              <SelectItem key={p.id_plan} value={String(p.id_plan)}>{p.descripcion_plan}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border bg-card">
        {isFetching ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
            <Spinner size="sm" /> Cargando catálogo…
          </div>
        ) : tree.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Sin módulos configurados.</p>
        ) : (
          <div className="px-4">
            {tree.map((node) => (
              <PermissionRow key={node.uniqueId} node={node} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
