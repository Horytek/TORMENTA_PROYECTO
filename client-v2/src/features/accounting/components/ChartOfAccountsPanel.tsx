import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, ChevronDown, Plus, Trash2, BookLock } from "lucide-react";
import { SearchInput } from "@/components/shared/SearchInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { getCuentasContables, deleteCuentaContable } from "../api/accounting";
import type { CuentaContable } from "../types";
import { AccountFormDialog } from "./AccountFormDialog";

interface TreeNode extends CuentaContable {
  hijos: TreeNode[];
}

function buildTree(cuentas: CuentaContable[]): TreeNode[] {
  const byId = new Map<number, TreeNode>();
  cuentas.forEach((c) => byId.set(c.id_cuenta, { ...c, hijos: [] }));
  const roots: TreeNode[] = [];
  byId.forEach((node) => {
    if (node.id_cuenta_padre && byId.has(node.id_cuenta_padre)) {
      byId.get(node.id_cuenta_padre)!.hijos.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

function matchesFilter(node: TreeNode, filter: string): boolean {
  if (!filter) return true;
  const self = `${node.codigo} ${node.nombre}`.toLowerCase().includes(filter);
  return self || node.hijos.some((h) => matchesFilter(h, filter));
}

function AccountRow({ node, depth, filter, onAdd, onDelete }: {
  node: TreeNode; depth: number; filter: string;
  onAdd: (padre: CuentaContable) => void; onDelete: (cuenta: CuentaContable) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  if (!matchesFilter(node, filter)) return null;

  // Visual classes based on level/depth
  let rowStyle = "group flex items-center gap-2 rounded-lg pr-2 hover:bg-muted/50 transition-colors h-10 mt-1 first:mt-0";
  let nameStyle = "text-sm text-foreground/80";
  let codeStyle = "num text-xs text-muted-foreground w-16 shrink-0 font-mono";

  if (depth === 0) {
    rowStyle += " bg-muted/20 border border-border/30 h-11 font-bold";
    nameStyle = "text-sm font-bold tracking-tight text-foreground uppercase";
    codeStyle = "num text-xs text-foreground/60 w-16 shrink-0 font-bold font-mono";
  } else if (depth === 1) {
    rowStyle += " h-10 font-semibold";
    nameStyle = "text-sm font-semibold text-foreground/90";
    codeStyle = "num text-xs text-muted-foreground w-16 shrink-0 font-medium font-mono";
  }

  return (
    <div>
      <div className={rowStyle} style={{ paddingLeft: "8px" }}>
        {/* Indentation guide lines */}
        {Array.from({ length: depth }).map((_, i) => (
          <div
            key={i}
            className="w-5 h-full border-r border-border/30 shrink-0 self-stretch mr-1.5"
          />
        ))}

        {node.hijos.length > 0 ? (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0 p-0.5 rounded hover:bg-muted"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <span className="w-5 shrink-0" />
        )}

        <span className={codeStyle}>{node.codigo}</span>
        <span className={nameStyle}>{node.nombre}</span>

        <div className="flex items-center gap-1.5 ml-2">
          {node.estado === 0 && (
            <Badge variant="destructive" className="text-[10px] scale-90 origin-left px-1.5 py-0">
              Inactiva
            </Badge>
          )}
          {!node.permite_movimiento ? (
            <Badge
              variant="secondary"
              className="text-[9px] font-semibold gap-1 bg-primary/5 text-primary border border-primary/20 scale-90 origin-left px-1.5 py-0"
            >
              <BookLock className="h-2.5 w-2.5" /> Mayor
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-[9px] font-semibold gap-1 bg-green-500/5 text-green-600 border border-green-500/20 dark:text-green-400 dark:border-green-500/30 scale-90 origin-left px-1.5 py-0"
            >
              Detalle
            </Badge>
          )}
          {node.es_conciliable === 1 && (
            <Badge
              variant="outline"
              className="text-[9px] font-semibold bg-amber-500/5 text-amber-600 border border-amber-500/20 dark:text-amber-400 dark:border-amber-500/30 scale-90 origin-left px-1.5 py-0"
            >
              Conciliable
            </Badge>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-md hover:bg-muted/80"
            onClick={() => onAdd(node)}
            title="Agregar subcuenta"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-md hover:bg-destructive/10 text-destructive"
            onClick={() => onDelete(node)}
            title="Eliminar cuenta"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {expanded && node.hijos.map((hijo) => (
        <AccountRow
          key={hijo.id_cuenta}
          node={hijo}
          depth={depth + 1}
          filter={filter}
          onAdd={onAdd}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

export function ChartOfAccountsPanel() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [defaultPadre, setDefaultPadre] = useState<CuentaContable | null>(null);
  const [deleting, setDeleting] = useState<CuentaContable | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data: cuentas = [], isLoading } = useQuery({ queryKey: ["cuentas-contables"], queryFn: getCuentasContables });
  const tree = useMemo(() => buildTree(cuentas), [cuentas]);
  const filtroLower = filter.trim().toLowerCase();

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCuentaContable(id),
    onSuccess: (ok) => {
      if (!ok) {
        setDeleteError("No se pudo eliminar: la cuenta tiene subcuentas o movimientos asociados.");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["cuentas-contables"] });
      setDeleting(null);
      setDeleteError(null);
    },
    onError: () => setDeleteError("No se pudo eliminar: la cuenta tiene subcuentas o movimientos asociados."),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
        <SearchInput
          placeholder="Buscar por código o nombre..."
          value={filter}
          onChangeValue={setFilter}
          wrapperClassName="max-w-xs"
        />
        <Button onClick={() => { setDefaultPadre(null); setIsFormOpen(true); }} className="ml-auto gap-2">
          <Plus className="h-4 w-4" /> Nueva cuenta
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card p-2">
        {isLoading ? (
          <p className="p-4 text-sm text-muted-foreground">Cargando plan de cuentas...</p>
        ) : tree.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-foreground">Sin cuentas registradas</p>
            <p className="mt-1 text-sm text-muted-foreground">Crea la primera cuenta del plan contable.</p>
          </div>
        ) : (
          tree.map((node) => (
            <AccountRow
              key={node.id_cuenta}
              node={node}
              depth={0}
              filter={filtroLower}
              onAdd={(padre) => { setDefaultPadre(padre); setIsFormOpen(true); }}
              onDelete={(cuenta) => { setDeleting(cuenta); setDeleteError(null); }}
            />
          ))
        )}
      </div>

      {isFormOpen && (
        <AccountFormDialog
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          cuentas={cuentas}
          defaultPadre={defaultPadre}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => { setDeleting(null); setDeleteError(null); }}
        title="¿Eliminar cuenta?"
        description={deleteError || `Se eliminará "${deleting?.codigo} — ${deleting?.nombre}". Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
        isPending={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id_cuenta)}
      />
    </div>
  );
}
