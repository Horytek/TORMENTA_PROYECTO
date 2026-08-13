import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDown, ScanLine } from "lucide-react";
import { adminValidarPickup } from "../api/catalogoPublico";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type UiPhase = "idle" | "scanning" | "done" | "error";

type DoneInfo = {
  codigo: string;
  total?: number;
  comprador_nombre?: string;
  sucursal_nombre?: string;
  already_delivered?: boolean;
};

type ScannerControls = { stop: () => void };

const RAPIDO_KEY = "tienda-erp-recojo-rapido";

function playBeep() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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

export default function TiendaAdminRecojoPage() {
  const [phase, setPhase] = useState<UiPhase>("idle");
  const [manualOpen, setManualOpen] = useState(false);
  const [codigoManual, setCodigoManual] = useState("");
  const [tokenManual, setTokenManual] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [doneInfo, setDoneInfo] = useState<DoneInfo | null>(null);
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
  const pendingRef = useRef(false);
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
    setErrorMsg(null);
    setDoneInfo(null);
    handledScanRef.current = false;
    pendingRef.current = false;
  }, [stopCamera]);

  const startScanning = useCallback(() => {
    if (autoScanTimerRef.current) {
      clearTimeout(autoScanTimerRef.current);
      autoScanTimerRef.current = null;
    }
    setErrorMsg(null);
    setDoneInfo(null);
    handledScanRef.current = false;
    pendingRef.current = false;
    setPhase("scanning");
  }, []);

  const validarMut = useMutation({
    mutationFn: (body: { token?: string; codigo?: string }) => adminValidarPickup(body),
    onSuccess: (data) => {
      pendingRef.current = false;
      stopCamera();
      playBeep();
      setDoneInfo(data as DoneInfo);
      setPhase("done");
      toast.success(
        data?.already_delivered ? "Ya estaba entregado" : `Entregado: ${data?.codigo || ""}`
      );
      autoScanTimerRef.current = setTimeout(() => {
        if (modoRapido) startScanning();
      }, 2000);
    },
    onError: (e: unknown) => {
      pendingRef.current = false;
      handledScanRef.current = false;
      stopCamera();
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "QR inválido";
      setErrorMsg(msg);
      setPhase("error");
      toast.error(msg);
    },
  });

  const procesarScan = useCallback(
    (text: string) => {
      const payload = text.trim();
      if (!payload || handledScanRef.current || pendingRef.current) return;
      handledScanRef.current = true;
      pendingRef.current = true;
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

  return (
    <div className="space-y-5 max-w-lg mx-auto w-full pb-[env(safe-area-inset-bottom)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Recojo en tienda</h1>
          <p className="text-sm text-stone-500 mt-1">Escanea el QR del comprador o ingresa el token.</p>
        </div>
        <label className="flex items-center gap-2 text-xs text-stone-600">
          <input
            type="checkbox"
            checked={modoRapido}
            onChange={(e) => setRapido(e.target.checked)}
          />
          Modo rápido
        </label>
      </div>

      {phase === "idle" && (
        <div className="space-y-3">
          <Button className="w-full h-12 gap-2" onClick={startScanning}>
            <ScanLine className="size-5" /> Abrir cámara
          </Button>
          <button
            type="button"
            className="flex w-full items-center justify-between text-sm text-stone-600 px-1"
            onClick={() => setManualOpen((v) => !v)}
          >
            Entrada manual
            <ChevronDown className={cn("size-4 transition", manualOpen && "rotate-180")} />
          </button>
          {manualOpen && (
            <div className="rounded-xl border border-stone-200 bg-white p-3 space-y-2">
              <Input
                placeholder="Token QR"
                className="font-mono"
                value={tokenManual}
                onChange={(e) => setTokenManual(e.target.value)}
              />
              <Input
                placeholder="O código de pedido"
                className="font-mono"
                value={codigoManual}
                onChange={(e) => setCodigoManual(e.target.value)}
              />
              <Button
                className="w-full"
                disabled={validarMut.isPending || (!tokenManual.trim() && !codigoManual.trim())}
                onClick={() =>
                  validarMut.mutate(
                    tokenManual.trim()
                      ? { token: tokenManual.trim() }
                      : { codigo: codigoManual.trim() }
                  )
                }
              >
                Confirmar entrega
              </Button>
            </div>
          )}
        </div>
      )}

      {phase === "scanning" && (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-2xl bg-black aspect-[3/4] max-h-[60vh]">
            <video ref={videoRef} className="absolute inset-0 size-full object-cover" muted playsInline />
            {!cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center text-white/80 text-sm">
                Iniciando cámara…
              </div>
            )}
            <div className="absolute inset-x-8 top-1/3 h-40 border-2 border-white/70 rounded-xl" />
          </div>
          <Button variant="outline" className="w-full" onClick={goIdle}>
            Cancelar
          </Button>
        </div>
      )}

      {phase === "done" && doneInfo && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 space-y-2">
          <p className="text-sm font-semibold text-emerald-900">
            {doneInfo.already_delivered ? "Ya entregado" : "Entrega confirmada"}
          </p>
          <p className="font-mono text-lg">{doneInfo.codigo}</p>
          {doneInfo.comprador_nombre && (
            <p className="text-sm text-emerald-800">{doneInfo.comprador_nombre}</p>
          )}
          {doneInfo.total != null && (
            <p className="text-sm">Total S/ {Number(doneInfo.total).toFixed(2)}</p>
          )}
          {doneInfo.sucursal_nombre && (
            <p className="text-xs text-emerald-700">{doneInfo.sucursal_nombre}</p>
          )}
          <Button className="w-full mt-2" onClick={startScanning}>
            Escanear otro
          </Button>
        </div>
      )}

      {phase === "error" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 space-y-3">
          <p className="text-sm text-red-800">{errorMsg}</p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={goIdle}>
              Volver
            </Button>
            <Button className="flex-1" onClick={startScanning}>
              Reintentar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
