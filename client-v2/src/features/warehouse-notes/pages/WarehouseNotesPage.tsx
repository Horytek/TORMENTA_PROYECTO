import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useQueryState, parseAsString } from "nuqs";
import * as XLSX from "xlsx";
import { Plus, FileSpreadsheet, ArrowDownCircle, ArrowUpCircle, Search, Inbox } from "lucide-react";

import { useUserStore } from "@/store/useUserStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import NoteFormDialog from "../components/NoteFormDialog";
import { NoteRow } from "../components/NoteRow";
import {
  getNotasIngreso,
  getNotasSalida,
  getAlmacenesIngreso,
  getAlmacenesSalida,
  anularNotaIngreso,
  anularNotaSalida,
} from "../api/warehouseNotes";
import type { WarehouseNote, NoteKind } from "../types";

const PAGE_SIZE = 10;

export default function WarehouseNotesPage() {
  const queryClient = useQueryClient();
  const user = useUserStore((s) => s.user);
  const capabilities = useUserStore((s) => s.capabilities);
  const can = (perm: string) => user?.roleId === 10 || capabilities.has(perm) || capabilities.has("*");
  const canCreate = can("nota_almacen.create");
  const canDeactivate = can("nota_almacen.deactivate");
  const canGenerate = can("nota_almacen.generate");

  const [tab, setTab] = useQueryState("tab", parseAsString.withDefault("ingreso"));
  const tipo = (tab === "salida" ? "salida" : "ingreso") as NoteKind;

  const [searchTerm, setSearchTerm] = useQueryState("q", parseAsString.withDefault(""));
  const [almacenFiltro, setAlmacenFiltro] = useQueryState("almacen", parseAsString.withDefault(""));

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [anulando, setAnulando] = useState<WarehouseNote | null>(null);
  const [page, setPage] = useState(1);

  const { data: notas = [], isLoading } = useQuery<WarehouseNote[]>({
    queryKey: tipo === "salida" ? ["notas-salida", almacenFiltro] : ["notas-ingreso", almacenFiltro],
    queryFn: () =>
      tipo === "salida"
        ? getNotasSalida({ almacen: almacenFiltro || undefined, limit: 200 })
        : getNotasIngreso({ almacen: almacenFiltro || undefined, limit: 200 }),
  });

  const { data: almacenes = [] } = useQuery({
    queryKey: ["nota-almacen-almacenes-filtro", tipo],
    queryFn: () => (tipo === "salida" ? getAlmacenesSalida() : getAlmacenesIngreso()),
  });

  const anularMutation = useMutation({
    mutationFn: (nota: WarehouseNote) =>
      tipo === "salida"
        ? anularNotaSalida(nota.id, user?.username ?? "")
        : anularNotaIngreso(nota.id, user?.username ?? ""),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tipo === "salida" ? ["notas-salida"] : ["notas-ingreso"] });
      setAnulando(null);
    },
  });

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return notas;
    return notas.filter((n) =>
      [n.documento, n.proveedor, n.concepto, n.usuario].some((v) => v?.toLowerCase().includes(q))
    );
  }, [notas, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleExport = () => {
    const rows = filtered.map((n) => ({
      Documento: n.documento,
      Fecha: n.fecha,
      [tipo === "ingreso" ? "Proveedor" : "Destinatario"]: n.proveedor,
      Concepto: n.concepto,
      Origen: n.almacen_O ?? "-",
      Destino: n.almacen_D ?? "-",
      Items: n.detalles?.length ?? 0,
      Estado: Number(n.estado) === 1 ? "Anulado" : "Activo",
      Usuario: n.usuario,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte");
    XLSX.writeFile(wb, `notas_${tipo}.xlsx`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Notas de Almacén</h1>
          <p className="text-sm text-muted-foreground">Ingresos y salidas de inventario.</p>
        </div>
        <Tabs value={tipo} onValueChange={(v) => { setTab(v); setExpandedId(null); setPage(1); }}>
          <TabsList>
            <TabsTrigger value="ingreso" className="gap-1.5">
              <ArrowDownCircle className="h-3.5 w-3.5" /> Entradas
            </TabsTrigger>
            <TabsTrigger value="salida" className="gap-1.5">
              <ArrowUpCircle className="h-3.5 w-3.5" /> Salidas
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" strokeWidth={1.5} />
            <Input
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              placeholder="Buscar por documento, proveedor, concepto o usuario…"
              className="h-9 pl-9"
            />
          </div>
          <Select value={almacenFiltro || "__all__"} onValueChange={(v) => { setAlmacenFiltro(v === "__all__" ? "" : v); setPage(1); }}>
            <SelectTrigger className="h-9 w-44 shrink-0"><SelectValue placeholder="Todos los almacenes" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos los almacenes</SelectItem>
              {almacenes.map((a) => (
                <SelectItem key={a.id} value={String(a.id)}>{a.almacen}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {canGenerate && (
            <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={handleExport} disabled={filtered.length === 0}>
              <FileSpreadsheet className="h-4 w-4" /> Exportar Excel
            </Button>
          )}
          {canCreate && (
            <Button size="sm" className="h-9 gap-1.5" onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4" /> Nueva nota
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col divide-y divide-border/40">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-40 animate-pulse rounded bg-muted" />
                  <div className="h-2.5 w-24 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60">
              <Inbox className="h-5 w-5 text-muted-foreground/60" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground/80">
                {tipo === "ingreso" ? "No hay ingresos registrados" : "No hay salidas registradas"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                {searchTerm ? "Ajusta el término de búsqueda." : "Registra tu primer movimiento."}
              </p>
            </div>
            {!searchTerm && canCreate && (
              <Button size="sm" className="mt-2 gap-1.5" onClick={() => setIsFormOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Nueva nota
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-12 gap-3 border-b border-border bg-muted/20 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 md:grid">
              <div className="col-span-3">Documento</div>
              <div className="col-span-3">{tipo === "ingreso" ? "Proveedor" : "Destinatario"}</div>
              <div className="col-span-2">Concepto</div>
              <div className="col-span-2">Almacenes</div>
              <div className="col-span-2 text-right">Estado</div>
            </div>
            <div>
              {paginated.map((note) => (
                <NoteRow
                  key={note.id}
                  note={note}
                  tipo={tipo}
                  isExpanded={expandedId === note.id}
                  onToggle={() => setExpandedId((prev) => (prev === note.id ? null : note.id))}
                  canDeactivate={canDeactivate}
                  canGeneratePdf={canGenerate}
                  onAnular={() => setAnulando(note)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border/40 pt-4">
          <span className="text-xs text-muted-foreground">Página {page} de {totalPages} · {filtered.length} registros</span>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" className="h-8 px-3 text-xs" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Anterior
            </Button>
            <Button variant="outline" size="sm" className="h-8 px-3 text-xs" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              Siguiente
            </Button>
          </div>
        </div>
      )}

      <NoteFormDialog isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} defaultTipo={tipo} />

      <ConfirmDialog
        open={!!anulando}
        onClose={() => setAnulando(null)}
        onConfirm={() => anulando && anularMutation.mutate(anulando)}
        title="¿Anular esta nota?"
        description={
          <>
            Esta acción no se puede deshacer y revertirá el movimiento de stock asociado.
            <br />
            <span className="mt-1 inline-block font-medium text-foreground">{anulando?.documento ?? ""}</span>
          </>
        }
        confirmLabel="Anular"
        variant="danger"
        isPending={anularMutation.isPending}
      />
    </div>
  );
}
