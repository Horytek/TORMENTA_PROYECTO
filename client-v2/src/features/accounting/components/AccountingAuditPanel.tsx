import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { getAuditoriaContable } from "../api/accounting";

const ACTION_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  CREATE: "default",
  UPDATE: "secondary",
  DELETE: "destructive",
  CLOSE: "secondary",
  REOPEN: "destructive",
  REVERSE: "outline",
};

const findTimestamp = (evento: Record<string, unknown>): string | null => {
  for (const key of ["created_at", "fecha", "f_creacion", "timestamp", "createdAt"]) {
    if (evento[key]) return String(evento[key]);
  }
  return null;
};

export function AccountingAuditPanel() {
  const { data: eventos = [], isLoading } = useQuery({
    queryKey: ["auditoria-contable"],
    queryFn: () => getAuditoriaContable({ limit: 200 }),
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Registro de solo lectura de las acciones sensibles del módulo contable (creación, edición, cierre, reapertura, reversión).
      </p>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Entidad</TableHead>
              <TableHead>Acción</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Detalle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Cargando...</TableCell></TableRow>
            ) : eventos.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Sin eventos de auditoría contable todavía.</TableCell></TableRow>
            ) : (
              eventos.map((ev) => (
                <TableRow key={ev.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{findTimestamp(ev) || "—"}</TableCell>
                  <TableCell>{ev.target_type}{ev.target_id ? ` #${ev.target_id}` : ""}</TableCell>
                  <TableCell><Badge variant={ACTION_VARIANT[ev.action] || "outline"}>{ev.action}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{ev.actor_role ? `Rol ${ev.actor_role}` : "—"} (usuario #{ev.actor_user_id ?? "?"})</TableCell>
                  <TableCell className="max-w-xs truncate text-xs text-muted-foreground">{ev.metadata_json || "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
