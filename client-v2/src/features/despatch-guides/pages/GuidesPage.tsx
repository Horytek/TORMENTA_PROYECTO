import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useQueryState, parseAsString } from "nuqs";
import { Plus, Search, Truck, User, Ban, ArrowRight } from "lucide-react";

import { useUserStore } from "@/store/useUserStore";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import GuideFormDialog from "../components/GuideFormDialog";
import { GuideDetailDrawer } from "../components/GuideDetailDrawer";
import { getGuias, getSucursalesGuia, anularGuia } from "../api/guides";
import type { Guide } from "../types";

import { AdaptiveCollection } from "@/components/shared/AdaptiveCollection";
import type { FieldDef, RecordAction } from "@/components/shared/AdaptiveCollection";

function formatFecha(fecha: string) {
  try {
    return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return fecha;
  }
}

export default function GuidesPage() {
  const queryClient = useQueryClient();
  const user = useUserStore((s) => s.user);
  const { can } = usePermissions();
  const canCreate = can("guia_remision.create");
  const canDeactivate = can("guia_remision.deactivate");
  const canGenerate = can("guia_remision.generate");

  const [searchTerm, setSearchTerm] = useQueryState("q", parseAsString.withDefault(""));
  const [sucursalFiltro, setSucursalFiltro] = useQueryState("sucursal", parseAsString.withDefault(""));

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const [anulando, setAnulando] = useState<Guide | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["guias", sucursalFiltro],
    queryFn: () => getGuias({ nombre_sucursal: sucursalFiltro || undefined, limit: 200 }),
  });
  const guias = data?.data ?? [];

  const { data: sucursales = [] } = useQuery({ queryKey: ["guia-sucursales-filtro"], queryFn: getSucursalesGuia });

  const activeGuide = useMemo(() => {
    if (!selectedGuide) return null;
    return guias.find((g) => g.id === selectedGuide.id) || selectedGuide;
  }, [guias, selectedGuide]);

  const anularMutation = useMutation({
    mutationFn: (guide: Guide) => anularGuia(guide.id, user?.username ?? ""),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guias"] });
      setAnulando(null);
    },
  });

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return guias;
    return guias.filter((g) =>
      [g.num_guia, g.cliente, g.documento, g.concepto, g.vendedor].some((v) => v?.toLowerCase().includes(q))
    );
  }, [guias, searchTerm]);

  const fields = useMemo<FieldDef<Guide>[]>(() => [
    {
      key: "num_guia",
      label: "N° Guía",
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
      key: "cliente",
      label: "Destinatario",
      priority: "secondary",
      semantic: "text",
      render: (v, item) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{String(v || "—")}</p>
          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground mt-0.5">
            <User className="h-3 w-3 shrink-0" /> {item.vendedor || "—"}
          </p>
        </div>
      ),
    },
    {
      key: "concepto",
      label: "Motivo",
      priority: "secondary",
      semantic: "badge",
      format: (v) => (v as string) || "—",
    },
    {
      key: "ruta",
      label: "Ruta",
      priority: "secondary",
      semantic: "icon-text",
      render: (_, item) => (
        <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
          <span className="truncate">{item.nombre_sucursal || "—"}</span>
          <ArrowRight className="h-3 w-3 shrink-0" />
          <span className="truncate">{item.dir_destino || "—"}</span>
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
            <Truck className="h-3.5 w-3.5" /> {count} {count === 1 ? "item" : "items"}
          </span>
        );
      },
    },
    {
      key: "estado",
      label: "Estado",
      priority: "secondary",
      semantic: "badge",
      format: (v) => (Number(v) === 1 ? "Activa" : "Anulada"),
    },
  ], []);

  const actions = useMemo<RecordAction[]>(() => [
    {
      id: "anular",
      label: "Anular guía",
      icon: <Ban className="h-3.5 w-3.5" />,
      onClick: (item) => setAnulando(item as Guide),
      variant: "destructive",
      disabled: (item) => Number((item as Guide).estado) !== 1 || !canDeactivate,
    },
  ], [canDeactivate]);

  const getRhythm = (guide: Guide) => ({
    type: "dot" as const,
    state: Number(guide.estado) === 1 ? ("active" as const) : ("inactive" as const),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Guías de Remisión</h1>
          <p className="text-sm text-muted-foreground">Traslados de mercadería y documentos de transporte.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" strokeWidth={1.5} />
            <Input
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setSelectedGuide(null); }}
              placeholder="Buscar por N° guía, destinatario, documento o vendedor…"
              className="h-9 pl-9"
            />
          </div>
          <Select value={sucursalFiltro || "__all__"} onValueChange={(v) => { setSucursalFiltro(v === "__all__" ? "" : v); setSelectedGuide(null); }}>
            <SelectTrigger className="h-9 w-44 shrink-0"><SelectValue placeholder="Todas las sucursales" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todas las sucursales</SelectItem>
              {sucursales.map((s) => (
                <SelectItem key={s.id} value={s.nombre}>{s.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {canCreate && (
          <Button size="sm" className="h-9 gap-1.5" onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4" /> Nueva guía
          </Button>
        )}
      </div>

      <AdaptiveCollection<Guide>
        items={filtered}
        fields={fields}
        actions={actions}
        isLoading={isLoading}
        layout="card"
        getItemId={(guide) => guide.id}
        getRhythm={getRhythm}
        onRecordClick={(guide) => setSelectedGuide(guide)}
        empty={{
          title: "No hay guías registradas",
          description: searchTerm ? "Ajusta el término de búsqueda." : "Registra tu primera guía de remisión.",
          action: !searchTerm && canCreate ? { label: "Nueva guía", onClick: () => setIsFormOpen(true) } : undefined,
        }}
      />

      <GuideFormDialog isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />

      <GuideDetailDrawer
        guide={activeGuide}
        isOpen={!!selectedGuide}
        onClose={() => setSelectedGuide(null)}
        canDeactivate={canDeactivate}
        canGeneratePdf={canGenerate}
        onAnular={() => selectedGuide && setAnulando(selectedGuide)}
      />

      <ConfirmDialog
        open={!!anulando}
        onClose={() => setAnulando(null)}
        onConfirm={() => anulando && anularMutation.mutate(anulando)}
        title="¿Anular esta guía?"
        description={
          <>
            Esta acción no se puede deshacer.
            <br />
            <span className="mt-1 inline-block font-medium text-foreground">{anulando?.num_guia ?? ""}</span>
          </>
        }
        confirmLabel="Anular"
        variant="danger"
        isPending={anularMutation.isPending}
      />
    </div>
  );
}
