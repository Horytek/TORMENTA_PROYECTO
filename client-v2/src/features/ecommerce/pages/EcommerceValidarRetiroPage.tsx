import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDown, ScanLine } from "lucide-react";
import { pickupValidar, pickupConfirmarEntrega } from "../api/ecommerce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPen } from "../types/storefront";
import { AttrsSnapshotText } from "../components/AttrsSnapshotText";
import { AdminBranchFilterBar, useScopedSucursalId } from "../components/admin/AdminBranchFilterBar";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { cn } from "@/lib/utils";

type UiPhase = "idle" | "scanning" | "found" | "error" | "confirming" | "done";

type OrdenValidada = {
  id_orden: number;
  codigo: string;
  nombre_comprador?: string;
  email_comprador?: string;
  telefono_comprador?: string;
  total: number;
  sucursal_nombre?: string;
  delivery_method?: string;
  items_count?: number;
  items?: { nombre: string; cantidad: number; precio_unitario: number; attrs_snapshot?: unknown }[];
};

type DoneInfo = {
  codigo: string;
  delivered_at?: string;
  empleado?: string | null;
};

type ScannerControls = { stop: () => void };

const RAPIDO_KEY = "ecom-recojo-rapido";

function playBeep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    setTimeout(() => {
      osc.stop();
      void ctx.close();
    }, 120);
  } catch {
    // noop
  }
}

function messageFromError(err: unknown, fallback: string): { code?: string; message: string } {
  const e = err as { response?: { data?: { code?: string; message?: string } }; message?: string };
  return {
    code: e.response?.data?.code,
    message: e.response?.data?.message || e.message || fallback,
  };
}

export default function EcommerceValidarRetiroPage() {
  const id_sucursal = useScopedSucursalId();
  const [phase, setPhase] = useState<UiPhase>("idle");
  const [manualOpen, setManualOpen] = useState(false);
  const [codigoManual, setCodigoManual] = useState("");
  const [orden, setOrden] = useState<OrdenValidada | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [doneInfo, setDoneInfo] = useState<DoneInfo | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [modoRapido, setModoRapido] = useState(() => {
    try {
      return localStorage.getItem(RAPIDO_KEY) === "1";
    } catch {
      return false;
    }
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const stopControlsRef = useRef<ScannerControls | null>(null);
  const handledScanRef = useRef(false);
  const validarPendingRef = useRef(false);
  const autoScanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setRapido = (v: boolean) => {
    setModoRapido(v);
    try {
      localStorage.setItem(RAPIDO_KEY, v ? "1" : "0");
    } catch {
      // noop
    }
  };

  const stopCamera = useCallback(() => {
    try {
      stopControlsRef.current?.stop();
    } catch {
      // noop
    }
    stopControlsRef.current = null;
    setCameraReady(false);
  }, []);

  const goIdle = useCallback(() => {
    if (autoScanTimerRef.current) {
      clearTimeout(autoScanTimerRef.current);
      autoScanTimerRef.current = null;
    }
    stopCamera();
    setPhase("idle");
    setOrden(null);
    setErrorMsg(null);
    setDoneInfo(null);
    setConfirmOpen(false);
    handledScanRef.current = false;
    validarPendingRef.current = false;
  }, [stopCamera]);

  const startScanning = useCallback(() => {
    if (autoScanTimerRef.current) {
      clearTimeout(autoScanTimerRef.current);
      autoScanTimerRef.current = null;
    }
    setOrden(null);
    setErrorMsg(null);
    setDoneInfo(null);
    setConfirmOpen(false);
    handledScanRef.current = false;
    validarPendingRef.current = false;
    setPhase("scanning");
  }, []);

  const validarMut = useMutation({
    mutationFn: (body: { token?: string; codigo?: string }) =>
      pickupValidar({ ...body, id_sucursal: id_sucursal || undefined }),
    onSuccess: (res) => {
      validarPendingRef.current = false;
      stopCamera();
      if (!res.success) {
        setErrorMsg(res.message || "No se pudo validar.");
        setPhase("error");
        handledScanRef.current = false;
        return;
      }
      playBeep();
      toast.success("Pedido encontrado");
      setOrden(res.data as OrdenValidada);
      setPhase("found");
    },
    onError: (e: unknown) => {
      validarPendingRef.current = false;
      handledScanRef.current = false;
      stopCamera();
      const { message } = messageFromError(e, "Error al validar");
      setErrorMsg(message);
      setPhase("error");
      toast.error(message);
    },
  });

  const confirmMut = useMutation({
    mutationFn: () =>
      pickupConfirmarEntrega(
        orden!.id_orden,
        (orden?.delivery_method as "qr_scan" | "manual_code") || "admin_panel"
      ),
    onSuccess: (res) => {
      setConfirmOpen(false);
      const data = res?.data as DoneInfo & { empleado?: string | null };
      setDoneInfo({
        codigo: orden?.codigo || data?.codigo || "",
        delivered_at: data?.delivered_at || new Date().toISOString(),
        empleado: data?.empleado ?? null,
      });
      setOrden(null);
      setPhase("done");
      toast.success("Entrega confirmada");

      autoScanTimerRef.current = setTimeout(() => {
        if (modoRapido) {
          startScanning();
        }
      }, 2000);
    },
    onError: (e: unknown) => {
      const { message } = messageFromError(e, "Error al confirmar");
      toast.error(message);
      setErrorMsg(message);
      setPhase("error");
      setConfirmOpen(false);
    },
  });

  const procesarScan = useCallback(
    (text: string) => {
      const payload = text.trim();
      if (!payload || handledScanRef.current || validarPendingRef.current) return;
      handledScanRef.current = true;
      validarPendingRef.current = true;
      validarMut.mutate({ token: payload });
    },
    [validarMut]
  );

  useEffect(() => {
    if (phase !== "scanning") {
      if (phase !== "idle") stopCamera();
      return;
    }

    let cancelled = false;
    handledScanRef.current = false;

    const start = async () => {
      const video = videoRef.current;
      if (!video) return;

      try {
        const { BrowserQRCodeReader } = await import("@zxing/browser");
        if (cancelled) return;

        const reader = new BrowserQRCodeReader(undefined, {
          delayBetweenScanAttempts: 300,
          delayBetweenScanSuccess: 1200,
        });

        const controls = await reader.decodeFromVideoDevice(undefined, video, (result) => {
          if (cancelled || !result) return;
          procesarScan(result.getText());
        });

        if (cancelled) {
          controls.stop();
          return;
        }

        stopControlsRef.current = controls;
        setCameraReady(true);
      } catch {
        if (!cancelled) {
          toast.error("No se pudo acceder a la cámara. Usa búsqueda manual.");
          setPhase("idle");
          setManualOpen(true);
        }
      }
    };

    void start();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [phase, procesarScan, stopCamera]);

  useEffect(() => {
    return () => {
      if (autoScanTimerRef.current) clearTimeout(autoScanTimerRef.current);
    };
  }, []);

  const itemsCount =
    orden?.items_count ??
    orden?.items?.reduce((acc, it) => acc + Number(it.cantidad || 0), 0) ??
    orden?.items?.length ??
    0;

  return (
    <div className="space-y-5 max-w-lg mx-auto w-full pb-[env(safe-area-inset-bottom)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Recojo en tienda</h1>
          <p className="text-stone-500 text-sm mt-1">
            Escanea el QR del cliente y confirma la entrega
          </p>
        </div>
        <AdminBranchFilterBar />
      </div>

      {phase === "idle" && (
        <div className="space-y-4">
          <Button
            className="w-full min-h-16 text-lg gap-2"
            onClick={startScanning}
          >
            <ScanLine className="size-6" />
            Escanear QR
          </Button>

          <label className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 cursor-pointer">
            <div>
              <p className="text-sm font-medium">Modo recojo rápido</p>
              <p className="text-xs text-stone-500">Tras confirmar, abre la cámara otra vez</p>
            </div>
            <input
              type="checkbox"
              className="size-5 accent-stone-900"
              checked={modoRapido}
              onChange={(e) => setRapido(e.target.checked)}
            />
          </label>

          <button
            type="button"
            className="flex w-full items-center justify-between text-sm text-stone-600 py-2"
            onClick={() => setManualOpen((v) => !v)}
          >
            Buscar por código o teléfono
            <ChevronDown className={cn("size-4 transition", manualOpen && "rotate-180")} />
          </button>

          {manualOpen && (
            <div className="space-y-3 rounded-xl border border-stone-200 bg-white p-4">
              <Input
                placeholder="Código pedido, retiro o teléfono"
                value={codigoManual}
                onChange={(e) => setCodigoManual(e.target.value)}
                className="font-mono text-base h-12 w-full"
                autoComplete="off"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && codigoManual.trim()) {
                    validarMut.mutate({ codigo: codigoManual.trim() });
                  }
                }}
              />
              <Button
                className="w-full min-h-12"
                onClick={() => validarMut.mutate({ codigo: codigoManual.trim() })}
                disabled={!codigoManual.trim() || validarMut.isPending}
              >
                {validarMut.isPending ? "Buscando…" : "Buscar"}
              </Button>
            </div>
          )}
        </div>
      )}

      {phase === "scanning" && (
        <div className="space-y-3">
          <div className="rounded-xl overflow-hidden border border-stone-200 bg-black relative">
            <video
              ref={videoRef}
              className="w-full min-h-[280px] aspect-[3/4] sm:aspect-video object-cover bg-black"
              muted
              playsInline
            />
            {!cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-stone-300 bg-black/60">
                Iniciando cámara…
              </div>
            )}
          </div>
          <Button variant="outline" className="w-full min-h-11" onClick={goIdle}>
            Cancelar
          </Button>
        </div>
      )}

      {phase === "found" && orden && (
        <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs uppercase text-stone-400">Pedido</p>
              <p className="text-xl font-semibold">{orden.codigo}</p>
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-md bg-emerald-100 text-emerald-900">
              Listo
            </span>
          </div>
          <p className="text-sm font-medium">
            {orden.nombre_comprador || orden.email_comprador || "Cliente"}
          </p>
          <p className="text-sm text-stone-500">
            {itemsCount} producto{itemsCount === 1 ? "" : "s"}
            {orden.sucursal_nombre ? ` · ${orden.sucursal_nombre}` : ""}
          </p>
          <p className="text-lg font-semibold text-teal-700">{formatPen(Number(orden.total))}</p>
          {(orden.items?.length ?? 0) > 0 && (
            <ul className="text-sm border-t pt-3 space-y-1">
              {orden.items!.map((it, i) => (
                <li key={i}>
                  {it.nombre} × {it.cantidad}
                  <AttrsSnapshotText snapshot={it.attrs_snapshot} />
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-col gap-2 pt-2">
            <Button
              className="w-full min-h-14 text-base"
              onClick={() => setConfirmOpen(true)}
              disabled={confirmMut.isPending}
            >
              Confirmar entrega
            </Button>
            <Button variant="outline" className="min-h-11" onClick={startScanning}>
              Volver a escanear
            </Button>
          </div>
        </div>
      )}

      {phase === "error" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 space-y-4 text-center">
          <p className="text-red-900 font-medium">{errorMsg || "No se pudo validar el pedido."}</p>
          <Button className="w-full min-h-12" onClick={startScanning}>
            Volver a escanear
          </Button>
          <Button variant="ghost" className="w-full" onClick={goIdle}>
            Ir al inicio
          </Button>
        </div>
      )}

      {phase === "done" && doneInfo && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 space-y-3 text-center">
          <p className="text-lg font-semibold text-emerald-900">Entregado</p>
          <p className="text-sm text-emerald-800">{doneInfo.codigo}</p>
          {doneInfo.delivered_at && (
            <p className="text-xs text-emerald-800/80">
              {new Date(doneInfo.delivered_at).toLocaleString("es-PE")}
              {doneInfo.empleado ? ` · ${doneInfo.empleado}` : ""}
            </p>
          )}
          {!modoRapido && (
            <Button className="w-full min-h-12 mt-2" onClick={startScanning}>
              Escanear siguiente
            </Button>
          )}
          {modoRapido && (
            <p className="text-xs text-emerald-800/70 pt-1">Abriendo cámara…</p>
          )}
          <Button variant="ghost" className="w-full" onClick={goIdle}>
            Ir al inicio
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="¿Confirmar entrega?"
        description={`Se marcará el pedido ${orden?.codigo} como entregado.`}
        confirmLabel={confirmMut.isPending ? "Confirmando…" : "Sí, entregar"}
        onConfirm={() => confirmMut.mutate()}
        isPending={confirmMut.isPending}
      />
    </div>
  );
}
