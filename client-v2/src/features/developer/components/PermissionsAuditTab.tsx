import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, ChevronRight, Eye, EyeOff } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { getIcon } from "@/lib/iconRegistry";
import { SECTION_ORDER } from "@/lib/navigationCatalog";
import {
  getPlanesDisponibles, getRolesPorPlan, getUnifiedCatalog,
  type MergedPermissionNode,
} from "../api/permissionsAudit";

const ACTION_LABELS: Record<string, string> = {
  ver: "Ver", crear: "Crear", editar: "Editar", eliminar: "Eliminar",
  desactivar: "Desactivar", generar: "Generar",
};

const SIN_PANTALLA = "Sin pantalla en client-v2";

function PermissionRow({ node, depth = 0 }: { node: MergedPermissionNode; depth?: number }) {
  const granted = node.availableActions.filter((a) => node.permissions[a]);
  const Icon = depth === 0 ? getIcon(node.icon) : null;
  return (
    <div>
      <div
        className={cn(
          "flex flex-wrap items-center gap-2 border-b border-border/60 py-2.5",
          depth > 0 && "pl-6"
        )}
      >
        {depth > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />}
        {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />}
        <span className={cn("min-w-[180px] text-sm", depth === 0 ? "font-semibold text-foreground" : "text-muted-foreground")}>
          {node.name}
        </span>
        {node.inSidebar ? (
          <Badge variant="outline" className="gap-1 text-[10px] font-normal text-muted-foreground">
            <Eye className="h-3 w-3" /> En sidebar
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1 text-[10px] font-normal text-muted-foreground/70">
            <EyeOff className="h-3 w-3" /> {node.isVisible ? "Sin pantalla" : "Oculto"}
          </Badge>
        )}
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
 * un rol + plan. Agrupa igual que el sidebar real de client-v2 (mismo
 * `SECTION_ORDER` de navigationCatalog.ts) y marca qué módulos tienen
 * pantalla/visibilidad real ahí — antes mostraba el catálogo crudo en orden
 * alfabético, mezclando módulos legacy sin pantalla con los reales.
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

  const sections = useMemo(() => {
    const byGroup = new Map<string, MergedPermissionNode[]>();
    const sinPantalla: MergedPermissionNode[] = [];
    for (const node of tree) {
      if (!node.inSidebar) {
        sinPantalla.push(node);
        continue;
      }
      const group = node.groupName || "General";
      const list = byGroup.get(group) ?? [];
      list.push(node);
      byGroup.set(group, list);
    }
    const ordered = SECTION_ORDER
      .map((label) => ({ label, items: byGroup.get(label) ?? [] }))
      .filter((s) => s.items.length > 0);
    if (sinPantalla.length > 0) ordered.push({ label: SIN_PANTALLA, items: sinPantalla });
    return ordered;
  }, [tree]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
        <ShieldCheck className="h-5 w-5 text-brand" />
        <div className="flex-1 min-w-[200px]">
          <p className="text-sm font-semibold text-foreground">Auditoría de permisos</p>
          <p className="text-xs text-muted-foreground">
            Mismo agrupamiento que el sidebar de client-v2 — "{SIN_PANTALLA}" son módulos legacy sin pantalla React todavía.
          </p>
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
        ) : sections.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Sin módulos configurados.</p>
        ) : (
          sections.map((section) => (
            <div key={section.label} className="border-b border-border/60 px-4 last:border-0">
              <p className="pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.label}
              </p>
              {section.items.map((node) => (
                <PermissionRow key={node.uniqueId} node={node} />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
