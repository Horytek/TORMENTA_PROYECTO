import { useEffect, useState } from "react";
import { AlertTriangle, Check, Pause, Play, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LandingProductModule } from "../../../modules/landingModule.types";
import { useLayoutChrome } from "../../layoutShared";

type Canal = "ERP" | "Ecommerce" | "Marketplace";

const trabajos: Record<Canal, string[]> = {
  ERP: ["Leyendo 248 productos", "Normalizando stock", "Publicando 12 cambios", "Job completado"],
  Ecommerce: ["Recibiendo 18 pedidos", "Validando clientes", "Descontando inventario", "Job completado"],
  Marketplace: ["Consultando catálogo", "Reintentando SKU-418", "Precio reconciliado", "Job completado"],
};

export function SyncJobConsole({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const [canal, setCanal] = useState<Canal>("ERP");
  const [paso, setPaso] = useState(0);
  const [activo, setActivo] = useState(true);

  useEffect(() => {
    if (!activo) return;
    const timer = window.setInterval(
      () => setPaso((actual) => (actual + 1) % trabajos[canal].length),
      1100,
    );
    return () => window.clearInterval(timer);
  }, [activo, canal]);

  const elegirCanal = (siguiente: Canal) => {
    setCanal(siguiente);
    setPaso(0);
  };

  return (
    <section className="border-b border-black/5 bg-[#101316] py-20 text-white md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">Consola de trabajos</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
          <h2 className={cn(displayClass, "max-w-2xl text-[clamp(1.9rem,4vw,2.8rem)] text-white")}>
            Mira cada movimiento, no una caja negra.
          </h2>
          <button
            type="button"
            onClick={() => setActivo((valor) => !valor)}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold"
            aria-label={activo ? "Pausar reproducción" : "Reproducir trabajos"}
          >
            {activo ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {activo ? "Pausar" : "Reproducir"}
          </button>
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-2xl">
          <div className="flex flex-wrap gap-1 border-b border-white/10 p-2">
            {(Object.keys(trabajos) as Canal[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => elegirCanal(item)}
                className={cn(
                  "rounded-lg px-4 py-2 font-mono text-xs transition",
                  canal === item ? "text-white" : "text-white/45 hover:text-white/80",
                )}
                style={canal === item ? { backgroundColor: accent.accent } : undefined}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="grid min-h-64 gap-6 p-6 md:grid-cols-[1fr_16rem]">
            <ol className="space-y-3 font-mono text-sm">
              {trabajos[canal].map((linea, indice) => (
                <li
                  key={linea}
                  className={cn(
                    "flex items-center gap-3 transition-opacity",
                    indice <= paso ? "opacity-100" : "opacity-20",
                  )}
                >
                  <span style={{ color: indice === paso ? accent.accent : undefined }}>
                    {indice < paso ? "✓" : indice === paso ? "›" : "·"}
                  </span>
                  <span>{linea}</span>
                </li>
              ))}
            </ol>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-xs text-white/45">Job activo</p>
              <p className="mt-2 font-mono text-lg">SYNC-{canal.slice(0, 3).toUpperCase()}-0248</p>
              <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${((paso + 1) / trabajos[canal].length) * 100}%`, backgroundColor: accent.accent }}
                />
              </div>
              <p className="mt-3 text-xs text-white/55">{paso + 1} de {trabajos[canal].length} operaciones</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SyncRouteBoard({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const [direccion, setDireccion] = useState<"pull" | "push">("pull");
  const destinos = direccion === "pull" ? ["Marketplace", "Sync", "ERP"] : ["ERP", "Sync", "Ecommerce"];

  return (
    <section className="border-b border-black/5 py-20 md:py-28" style={{ backgroundColor: accent.sectionTint }}>
      <div className="mx-auto max-w-6xl px-6">
        <h2 className={cn(displayClass, "text-[clamp(1.8rem,3.5vw,2.5rem)]")}>Cambia el sentido sin perder el control.</h2>
        <div className="mt-8 inline-flex rounded-full border border-black/10 bg-white p-1">
          {(["pull", "push"] as const).map((modo) => (
            <button
              key={modo}
              type="button"
              onClick={() => setDireccion(modo)}
              className={cn("rounded-full px-5 py-2 text-xs font-bold uppercase", direccion === modo && "text-white")}
              style={direccion === modo ? { backgroundColor: accent.accent } : undefined}
            >
              {modo}
            </button>
          ))}
        </div>
        <div className="mt-12 grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
          {destinos.map((destino, indice) => (
            <div key={destino} className="contents">
              <div className="rounded-2xl border border-black/5 bg-white p-6 text-center shadow-sm">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{indice === 1 ? "orquestador" : "sistema"}</p>
                <p className="mt-2 text-lg font-semibold">{destino}</p>
              </div>
              {indice < destinos.length - 1 ? (
                <RefreshCw className="mx-auto h-5 w-5 rotate-90 md:rotate-0" style={{ color: accent.accent }} />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SyncConflictResolver({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const [resuelto, setResuelto] = useState(false);

  return (
    <section className="border-b border-black/5 py-20 md:py-28" style={{ backgroundColor: accent.surface }}>
      <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-[0.8fr_1.2fr] md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: accent.accent }}>Excepción visible</p>
          <h2 className={cn(displayClass, "mt-3 text-[clamp(1.8rem,3.5vw,2.5rem)]")}>Un error se atiende; no se esconde.</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Decide qué fuente manda y deja registro del cambio.</p>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            {resuelto ? <Check className="h-5 w-5 text-emerald-600" /> : <AlertTriangle className="h-5 w-5 text-amber-500" />}
            <p className="font-semibold">{resuelto ? "Conflicto resuelto" : "SKU-418 · precio distinto"}</p>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <button type="button" onClick={() => setResuelto(true)} className="rounded-xl border p-4 text-left hover:border-current" style={{ color: accent.accent }}>
              <span className="block text-xs opacity-70">ERP</span>S/ 42.90
            </button>
            <button type="button" onClick={() => setResuelto(true)} className="rounded-xl border p-4 text-left hover:border-current" style={{ color: accent.accent }}>
              <span className="block text-xs opacity-70">Marketplace</span>S/ 45.00
            </button>
          </div>
          {resuelto ? <button type="button" onClick={() => setResuelto(false)} className="mt-5 text-xs font-semibold underline">Reabrir simulación</button> : null}
        </div>
      </div>
    </section>
  );
}
