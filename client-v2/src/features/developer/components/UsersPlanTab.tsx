import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

import { NewPlatformUserDialog } from "./NewPlatformUserDialog";
import { EditUserPlanDialog } from "./EditUserPlanDialog";
import { getPlatformUsers, getEmpresasList, deletePlatformUser } from "../api/developer";
import type { PlatformUser } from "../types";

const PLAN_LABELS: Record<string, string> = { basic: "Básico", pro: "Pro", enterprise: "Enterprise" };

export function UsersPlanTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [editUser, setEditUser] = useState<PlatformUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PlatformUser | null>(null);

  const { data: users = [], isLoading } = useQuery({ queryKey: ["developer-platform-users"], queryFn: getPlatformUsers });
  const { data: empresas = [] } = useQuery({ queryKey: ["developer-empresas"], queryFn: getEmpresasList });

  const deleteMutation = useMutation({
    mutationFn: (u: PlatformUser) => deletePlatformUser(u.id_usuario),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["developer-platform-users"] }); setDeleteTarget(null); },
  });

  const empresaName = (id: number | null) => empresas.find((e) => e.id_empresa === id)?.razonSocial;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchUser = !q || u.usua?.toLowerCase().includes(q);
      const matchPlan = !planFilter || u.plan_pago === planFilter;
      return matchUser && matchPlan;
    });
  }, [users, search, planFilter]);

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar usuario…" className="h-9 w-52" />
          <Select value={planFilter || "__all__"} onValueChange={(v) => setPlanFilter(v === "__all__" ? "" : v)}>
            <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Todos los planes" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos los planes</SelectItem>
              <SelectItem value="basic">Básico</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setIsNewOpen(true)}>
          <Plus className="h-4 w-4" /> Añadir usuario
        </Button>
      </div>

      <div className="rounded-xl border border-border">
        <div className="grid grid-cols-[1.5fr_1.5fr_auto_auto_auto_auto] gap-3 border-b border-border bg-muted/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <span>Empresa</span><span>Usuario</span><span>Plan</span><span>Estado</span><span>Fecha de pago</span><span className="text-right">Acciones</span>
        </div>
        {filtered.map((u) => (
          <div key={u.id_usuario} className="grid grid-cols-[1.5fr_1.5fr_auto_auto_auto_auto] items-center gap-3 border-b border-border/60 px-4 py-3 last:border-0">
            <span className="truncate text-sm text-foreground">{empresaName(u.id_empresa) || "Sin asignar"}</span>
            <span className="truncate text-sm font-medium text-foreground">{u.usua}</span>
            <Badge variant="secondary" className="justify-self-start font-normal capitalize">{PLAN_LABELS[u.plan_pago] || u.plan_pago}</Badge>
            <Badge variant={u.estado_usuario_1 === 1 ? "success" : "destructive"} className="justify-self-start font-normal">
              {u.estado_usuario_1 === 1 ? "Activo" : "Inactivo"}
            </Badge>
            <span className="text-xs text-muted-foreground">{u.fecha_pago ? new Date(u.fecha_pago).toLocaleDateString("es-PE") : "Sin fecha"}</span>
            <div className="flex justify-end gap-1">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditUser(u)}><Pencil className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(u)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No se encontraron usuarios.</p>}
      </div>

      <NewPlatformUserDialog isOpen={isNewOpen} onClose={() => setIsNewOpen(false)} />
      <EditUserPlanDialog isOpen={!!editUser} onClose={() => setEditUser(null)} user={editUser} empresas={empresas} />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        title="¿Eliminar este usuario?"
        description={`Se eliminará la cuenta de "${deleteTarget?.usua}" permanentemente.`}
        confirmLabel="Eliminar"
        variant="danger"
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
