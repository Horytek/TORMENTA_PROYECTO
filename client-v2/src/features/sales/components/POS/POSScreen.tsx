import { useState, useCallback, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Lock, RotateCcw } from "lucide-react";
import { guardarAlmacenes, leerAlmacenes } from "@/lib/catalogoOffline";
import { ProductCatalog } from "./ProductCatalog";
import { CartPanel } from "./CartPanel";
import { PaymentModal } from "./PaymentModal";
import { OfflineSyncBadge } from "./OfflineSyncBadge";
import { ClientSelector, CLIENTE_VARIOS } from "./ClientSelector";
import { HeldTicketsPanel } from "./HeldTicketsPanel";
import { ReturnWizard } from "@/features/returns/components/ReturnWizard";
import { TurnoCajaWidget } from "@/features/caja-turno/components/TurnoCajaWidget";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCartStore } from "@/store/useCartStore";
import { useConfigStore } from "@/store/useConfigStore";
import { useUserStore } from "@/store/useUserStore";
import { usePermissions } from "@/hooks/usePermissions";
import { getNegocio } from "@/features/settings/api/settings";
import { getKardexInventarioAlmacenes } from "@/features/kardex-inventario/api/kardexInventario";

// ─────────────────────────────────────────────────────────────────
// POSScreen — Pantalla principal del Punto de Venta
// ─────────────────────────────────────────────────────────────────

interface POSScreenProps {
  onSaleComplete?: (saleId: number, numComprobante: string) => void;
}

export function POSScreen({ onSaleComplete }: POSScreenProps) {
  const user = useUserStore((s) => s.user);
  const cliente = useCartStore((s) => s.cliente);
  const setCliente = useCartStore((s) => s.setCliente);
  const setIgvIncluido = useConfigStore((s) => s.setIgvIncluido);
  const { isAdmin, isDeveloper, can } = usePermissions();

  // El Administrador/Desarrollador (o quien tenga permiso explícito) puede elegir almacén.
  // Otros roles están vinculados únicamente a su almacén asignado por regla de negocio.
  const canSelectWarehouse = isAdmin || isDeveloper || can("pos.change_warehouse");

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [lastSaleId, setLastSaleId] = useState<number | null>(null);
  const [selectedAlmacenId, setSelectedAlmacenId] = useState<number | null>(null);
  const [returnWizardOpen, setReturnWizardOpen] = useState(false);
  const canDevolucion = can("devoluciones.create");

  // Obtener lista de almacenes disponibles.
  // Se guarda una foto porque sin ella, offline, `selectedAlmacenId` nunca se
  // resuelve y la pantalla queda en "Cargando almacén…" sin llegar a pedir el
  // catálogo: la caja no abre aunque el resto del soporte offline funcione.
  const { data: almacenesRed } = useQuery({
    queryKey: ["pos-almacenes"],
    queryFn: getKardexInventarioAlmacenes,
  });
  const [almacenesFoto, setAlmacenesFoto] = useState<typeof almacenesRed>(undefined);

  useEffect(() => {
    if (almacenesRed?.length) void guardarAlmacenes(almacenesRed);
  }, [almacenesRed]);

  // Se lee siempre al montar, sin esperar a que la consulta falle: offline
  // React Query pausa la consulta y nunca entra en error, así que esperar el
  // fallo dejaría el selector colgado en "Cargando almacén…" para siempre.
  useEffect(() => {
    let vigente = true;
    void leerAlmacenes<NonNullable<typeof almacenesRed>[number]>().then((guardados) => {
      if (vigente && guardados?.length) setAlmacenesFoto(guardados);
    });
    return () => {
      vigente = false;
    };
  }, []);

  const almacenes = useMemo(
    () => (almacenesRed?.length ? almacenesRed : (almacenesFoto ?? [])),
    [almacenesRed, almacenesFoto]
  );

  // Almacenes visibles según el rol del usuario
  const availableAlmacenes = useMemo(() => {
    if (canSelectWarehouse) {
      return almacenes;
    }
    // Para roles no administradores: filtrar solo por el almacén vinculado a su perfil o sucursal
    const assignedId = user?.original?.id_almacen || user?.original?.idAlmacen;
    if (assignedId) {
      const found = almacenes.filter((a) => a.id_almacen === Number(assignedId));
      if (found.length > 0) return found;
    }
    if (user?.sucursal) {
      const found = almacenes.filter(
        (a) => a.sucursal?.toLowerCase() === user.sucursal.toLowerCase()
      );
      if (found.length > 0) return found;
    }
    return almacenes.length > 0 ? [almacenes[0]] : [];
  }, [almacenes, canSelectWarehouse, user]);

  // Asignación inicial de almacén seleccionado
  useEffect(() => {
    if (selectedAlmacenId) return;

    if (availableAlmacenes.length > 0) {
      setSelectedAlmacenId(availableAlmacenes[0].id_almacen);
    }
  }, [availableAlmacenes, selectedAlmacenId]);

  // Cargar configuración global de IGV al montar
  const { data: negocio } = useQuery({
    queryKey: ["negocio"],
    queryFn: getNegocio,
    staleTime: Infinity,
  });

  // Sincronizar igv_incluido al store de config global
  useEffect(() => {
    if (negocio?.igv_incluido !== undefined) {
      setIgvIncluido(negocio.igv_incluido);
    }
  }, [negocio, setIgvIncluido]);

  // Asegurar que siempre hay cliente (default "Varios") antes de cobrar
  const handleCheckout = useCallback(() => {
    if (!cliente) {
      setCliente(CLIENTE_VARIOS);
    }
    setIsPaymentOpen(true);
  }, [cliente, setCliente]);

  const handleSaleComplete = useCallback(
    (saleId: number, numComprobante: string) => {
      setLastSaleId(saleId);
      onSaleComplete?.(saleId, numComprobante);
    },
    [onSaleComplete]
  );

  const handleClosePayment = useCallback(() => {
    setLastSaleId(null);
    setIsPaymentOpen(false);
  }, []);

  // Atajo de teclado: F12 cobra el carrito actual (mismo gesto que las cajas
  // registradoras físicas). No pisa F12 de DevTools porque el navegador
  // reserva esa combinación al margen del preventDefault de la página.
  const items = useCartStore((s) => s.items);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F12" && !isPaymentOpen && items.length > 0) {
        e.preventDefault();
        handleCheckout();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isPaymentOpen, items.length, handleCheckout]);

  return (
    <div className="flex flex-col h-full">
      {/* ── Header bar ─────────────────────────────────────── */}
      <div className="relative z-30 flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-border bg-card/80 backdrop-blur-sm shrink-0">
        <div className="flex flex-wrap items-center gap-3">
          <ClientSelector
            value={cliente}
            onChange={(c) => setCliente(c ?? CLIENTE_VARIOS)}
          />

          {/* Selector de Almacén de Stock */}
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 h-8 text-xs shrink-0 transition-colors hover:border-muted-foreground/40">
            <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-muted-foreground font-medium whitespace-nowrap hidden sm:inline">Stock de:</span>
            <Select
              value={selectedAlmacenId ? String(selectedAlmacenId) : ""}
              onValueChange={(val) => setSelectedAlmacenId(Number(val))}
              disabled={!canSelectWarehouse || availableAlmacenes.length <= 1}
            >
              <SelectTrigger className="h-full border-0 bg-transparent p-0 shadow-none text-xs font-semibold focus:ring-0 gap-1 min-w-[110px] focus:outline-none">
                <SelectValue placeholder="Cargando almacén…" />
              </SelectTrigger>
              <SelectContent align="start">
                {availableAlmacenes.map((alm) => (
                  <SelectItem key={alm.id_almacen} value={String(alm.id_almacen)}>
                    {alm.nom_almacen} {alm.sucursal ? `(${alm.sucursal})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!canSelectWarehouse && (
              <Lock
                className="h-3 w-3 text-muted-foreground/70 shrink-0"
              />
            )}
          </div>

          <HeldTicketsPanel />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <OfflineSyncBadge />
          {user?.sucursal && (
            <Badge variant="secondary" className="h-8 px-2.5 text-xs font-medium rounded-lg">
              📍 {user.sucursal}
            </Badge>
          )}
          {lastSaleId && (
            <Badge variant="outline" className="h-8 px-2.5 text-xs font-medium text-emerald-600 border-emerald-200 rounded-lg">
              ✓ Venta #{lastSaleId}
            </Badge>
          )}
          {canDevolucion && (
            <button
              onClick={() => setReturnWizardOpen(true)}
              className="flex items-center gap-1 rounded-lg border border-dashed border-muted-foreground/40 px-2.5 h-8 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" /> Cambio / Devolución
            </button>
          )}
          <TurnoCajaWidget idSucursal={user?.id_sucursal} />
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col md:flex-row gap-3 p-3 min-h-0 overflow-hidden">
        <div className="flex-1 min-h-0">
          <ProductCatalog selectedAlmacenId={selectedAlmacenId ?? undefined} />
        </div>
        <div className="w-full md:w-[380px] lg:w-[440px] xl:w-[500px] shrink-0 flex flex-col min-h-0">
          <CartPanel onCheckout={handleCheckout} disabled={false} />
        </div>
      </div>

      {/* ── Modal de pago ──────────────────────────────────── */}
      <PaymentModal
        open={isPaymentOpen}
        onClose={handleClosePayment}
        onSaleComplete={handleSaleComplete}
        selectedAlmacenId={selectedAlmacenId ?? undefined}
      />

      {/* ── Cambio / devolución sin salir del POS ─────────────
          Mismo componente que usa la pantalla de Devoluciones — acá solo se
          le da un atajo desde la venta activa, no se reconstruye la lógica. */}
      <ReturnWizard open={returnWizardOpen} onClose={() => setReturnWizardOpen(false)} />
    </div>
  );
}
