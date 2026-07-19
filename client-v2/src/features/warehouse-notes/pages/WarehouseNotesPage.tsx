import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useQueryState, parseAsString } from "nuqs";
import * as XLSX from "xlsx";
import {
  Plus,
  FileSpreadsheet,
  ArrowDownCircle,
  ArrowUpCircle,
  Search,
  ArrowRight,
  User,
  Package,
  Ban,
} from "lucide-react";

import { useUserStore } from "@/store/useUserStore";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Can } from "@/components/shared/Can";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import NoteFormDialog from "../components/NoteFormDialog";
import { NoteDetailDrawer } from "../components/NoteDetailDrawer";
import {
  getNotasIngreso,
  getNotasSalida,
  getAlmacenesIngreso,
  getAlmacenesSalida,
  anularNotaIngreso,
  anularNotaSalida,
} from "../api/warehouseNotes";
import type { WarehouseNote, NoteKind } from "../types";

import { AdaptiveCollection } from "@/components/shared/AdaptiveCollection";
import type { FieldDef, RecordAction } from "@/components/shared/AdaptiveCollection";

function formatFecha(fecha: string) {
  try {
    return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return fecha;
  }
}

export default function WarehouseNotesPage() {
  const queryClient = useQueryClient();
  const user = useUserStore((s) => s.user);
  const { can } = usePermissions();
  const canCreate = can("nota_almacen.create");
  const canDeactivate = can("nota_almacen.deactivate");
  const canGenerate = can("nota_almacen.generate");

  const [tab, setTab] = useQueryState("tab", parseAsString.withDefault("ingreso"));
  const tipo = (tab === "salida" ? "salida" : "ingreso") as NoteKind;

  const [searchTerm, setSearchTerm] = useQueryState("q", parseAsString.withDefault(""));
  const [almacenFiltro, setAlmacenFiltro] = useQueryState("almacen", parseAsString.withDefault(""));

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<WarehouseNote | null>(null);
  const [anulando, setAnulando] = useState<WarehouseNote | null>(null);

  const { data: notas = [], isLoading } = useQuery<WarehouseNote[]>({
    queryKey: tipo === "salida" ? ["notas-salida", almacenFiltro] : ["notas-ingreso", almacenFiltro],
    queryFn: () =>
      tipo === "salida"
        ? getNotasSalida({ almacen: almacenFiltro || undefined, limit: 200 })
        : getNotasIngreso({ almacen: almacenFiltro || undefined, limit: 200 }),
  });

  const activeNote = useMemo(() => {
    if (!selectedNote) return null;
    return notas.find((n) => n.id === selectedNote.id) || selectedNote;
  }, [notas, selectedNote]);

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

  // ── Fields para AdaptiveCard ──────────────────────────────
  const fields = useMemo<FieldDef<WarehouseNote>[]>(() => [
    {
      key: "documento",
      label: "Documento",
      priority: "primary",
      semantic: "title",
      render: (v) => <span className="font-mono font-semibold">{String(v)}</span>,
    },
    {
      key: "fecha",
      label: "Fecha",
      priority: "secondary",
      semantic: "subtitle",
      format: (v) => formatFecha(v as string),
    },
    {
      key: "proveedor",
      label: tipo === "ingreso" ? "Proveedor" : "Destinatario",
      priority: "secondary",
      semantic: "text",
      render: (v, item) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{String(v || "—")}</p>
          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground mt-0.5">
            <User className="h-3 w-3 shrink-0" /> {item.usuario || "—"}
          </p>
        </div>
      ),
    },
    {
      key: "concepto",
      label: "Concepto",
      priority: "secondary",
      semantic: "badge",
      format: (v) => (v as string) || "—",
    },
    {
      key: "almacenes",
      label: "Almacenes",
      priority: "secondary",
      semantic: "icon-text",
      render: (_, item) => (
        <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
          <span className="truncate">{item.almacen_O || "Externo"}</span>
          <ArrowRight className="h-3 w-3 shrink-0" />
          <span className="truncate">{item.almacen_D || "Externo"}</span>
        </div>
      ),
    },
    {
      key: "detalles",
      label: "Items",
      priority: "secondary",
      semantic: "number",
      render: (v) => {
        const count = Array.isArray(v) ? v.length : 0;
        return (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Package className="h-3.5 w-3.5" /> {count} {count === 1 ? "item" : "items"}
          </span>
        );
      },
    },
    {
      key: "estado",
      label: "Estado",
      priority: "secondary",
      semantic: "badge",
      format: (v) => (Number(v) === 1 ? "Anulado" : "Activo"),
    },
  ], [tipo]);

  const actions = useMemo<RecordAction[]>(() => [
    {
      id: "anular",
      label: "Anular nota",
      icon: <Ban className="h-3.5 w-3.5" />,
      onClick: (item) => setAnulando(item as WarehouseNote),
      variant: "destructive",
      disabled: (item) => Number((item as WarehouseNote).estado) === 1 || !canDeactivate,
    },
  ], [canDeactivate]);

  const getRhythm = (note: WarehouseNote) => ({
    type: "dot" as const,
    state: Number(note.estado) === 1 ? ("inactive" as const) : ("active" as const),
  });

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
        <Tabs value={tipo} onValueChange={(v) => { setTab(v); setSelectedNote(null); }}>
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
              onChange={(e) => { setSearchTerm(e.target.value); setSelectedNote(null); }}
              placeholder="Buscar por documento, proveedor, concepto o usuario…"
              className="h-9 pl-9"
            />
          </div>
          <Select value={almacenFiltro || "__all__"} onValueChange={(v) => { setAlmacenFiltro(v === "__all__" ? "" : v); setSelectedNote(null); }}>
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
          <Can capability="nota_almacen.generate">
            <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={handleExport} disabled={filtered.length === 0}>
              <FileSpreadsheet className="h-4 w-4" /> Exportar Excel
            </Button>
          </Can>
          <Can capability="nota_almacen.create">
            <Button size="sm" className="h-9 gap-1.5" onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4" /> Nueva nota
            </Button>
          </Can>
        </div>
      </div>

      <AdaptiveCollection<WarehouseNote>
        items={filtered}
        fields={fields}
        actions={actions}
        isLoading={isLoading}
        layout="card"
        getItemId={(note) => note.id}
        getRhythm={getRhythm}
        onRecordClick={(note) => setSelectedNote(note)}
        empty={{
          title: tipo === "ingreso" ? "No hay ingresos registrados" : "No hay salidas registradas",
          description: searchTerm ? "Ajusta el término de búsqueda." : "Registra tu primer movimiento.",
          action: !searchTerm && canCreate ? { label: "Nueva nota", onClick: () => setIsFormOpen(true) } : undefined,
        }}
      />

      <NoteFormDialog isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} defaultTipo={tipo} />

      <NoteDetailDrawer
        note={activeNote}
        isOpen={!!selectedNote}
        onClose={() => setSelectedNote(null)}
        tipo={tipo}
        canDeactivate={canDeactivate}
        canGeneratePdf={canGenerate}
        onAnular={() => selectedNote && setAnulando(selectedNote)}
      />

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
