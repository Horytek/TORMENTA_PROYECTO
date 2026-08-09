import { SceneCard, SceneChip, SceneLabel, SceneProgress } from "./sceneShared";

export function SceneTaller() {
  return (
    <SceneCard accent="#EA580C">
      <div className="flex items-center justify-between">
        <SceneLabel>Orden de trabajo</SceneLabel>
        <SceneChip color="#EA580C">En corte</SceneChip>
      </div>
      <p className="mt-2 font-mono text-lg font-bold tracking-tight">OT-2026-084</p>
      <p className="text-[13px] text-black/55">Lote polo oversize · 24 uds</p>
      <ul className="mt-4 space-y-2 text-[12px]">
        <li className="flex justify-between border-b border-black/8 pb-1.5">
          <span>Tela jersey</span>
          <span className="font-mono">18.2 m</span>
        </li>
        <li className="flex justify-between border-b border-black/8 pb-1.5">
          <span>Hilo 40/2</span>
          <span className="font-mono">6 conos</span>
        </li>
        <li className="flex justify-between">
          <span>Merma estimada</span>
          <span className="font-semibold text-[#EA580C]">4.2%</span>
        </li>
      </ul>
      <div className="mt-4 space-y-1">
        <div className="flex justify-between text-[10px] uppercase tracking-wide text-black/40">
          <span>Progreso OT</span>
          <span>2 / 4 pasos</span>
        </div>
        <SceneProgress value={50} color="#EA580C" />
      </div>
    </SceneCard>
  );
}

export function SceneWms() {
  return (
    <SceneCard accent="#4F46E5">
      <SceneLabel>Ubicación</SceneLabel>
      <p className="mt-1 font-mono text-2xl font-bold tracking-wider text-[#4F46E5]">A-03-R2-B14</p>
      <p className="text-[11px] text-black/45">Pasillo A · Rack 03 · Bin 14</p>
      <div className="mt-4 rounded-lg border border-[#4F46E5]/25 bg-[#4F46E5]/5 p-3">
        <div className="flex items-center justify-between">
          <SceneLabel>Tarea picking</SceneLabel>
          <SceneChip color="#4F46E5">Pendiente</SceneChip>
        </div>
        <p className="mt-2 text-[14px] font-semibold">SKU POL-0432</p>
        <div className="mt-2 flex justify-between text-[12px] text-black/55">
          <span>Cantidad</span>
          <span className="font-mono font-semibold text-foreground">×12</span>
        </div>
        <div className="mt-1 flex justify-between text-[12px] text-black/55">
          <span>Destino</span>
          <span>Packing bay 2</span>
        </div>
      </div>
    </SceneCard>
  );
}

export function SceneEnvios() {
  return (
    <SceneCard accent="#0891B2">
      <div className="flex items-center justify-between">
        <SceneLabel>Guía courier</SceneLabel>
        <span className="font-mono text-[12px] font-bold text-[#0891B2]">DEMO01</span>
      </div>
      <p className="mt-2 text-[14px] font-semibold">María Quispe</p>
      <p className="text-[12px] text-black/45">Av. Primavera 421 · Surco</p>
      <ol className="mt-4 space-y-3">
        {[
          { t: "Recibido en hub", d: "Hoy 09:12", on: true },
          { t: "En ruta", d: "Hoy 11:40", on: true },
          { t: "Entregado", d: "Pendiente", on: false },
        ].map((e, i) => (
          <li key={e.t} className="flex gap-3">
            <span className="flex flex-col items-center">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: e.on ? "#0891B2" : "#d4d4d8" }}
              />
              {i < 2 ? <span className="mt-1 w-px flex-1 bg-black/10" /> : null}
            </span>
            <div className="-mt-0.5 pb-2">
              <p className="text-[12px] font-medium">{e.t}</p>
              <p className="text-[10px] text-black/40">{e.d}</p>
            </div>
          </li>
        ))}
      </ol>
    </SceneCard>
  );
}

export function SceneDespacho() {
  return (
    <SceneCard accent="#16A34A">
      <div className="flex items-center justify-between">
        <SceneLabel>Ruta del día</SceneLabel>
        <SceneChip color="#16A34A">ETA 16:20</SceneChip>
      </div>
      <p className="mt-2 text-[14px] font-semibold">Unidad ABC-123 · Chofer Demo</p>
      <ol className="mt-4 space-y-2">
        {[
          { n: 1, place: "Almacén San Isidro", done: true },
          { n: 2, place: "Cliente Miraflores", done: true },
          { n: 3, place: "Cliente Barranco", done: false },
          { n: 4, place: "Retorno hub", done: false },
        ].map((s) => (
          <li
            key={s.n}
            className="flex items-center gap-2.5 rounded-lg border border-black/8 px-2.5 py-2 text-[12px]"
            style={s.done ? { backgroundColor: "rgba(22,163,74,0.08)" } : undefined}
          >
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
              style={{ backgroundColor: s.done ? "#16A34A" : "#a1a1aa" }}
            >
              {s.n}
            </span>
            <span className={s.done ? "text-black/50 line-through" : "font-medium"}>{s.place}</span>
          </li>
        ))}
      </ol>
    </SceneCard>
  );
}

export function SceneTaxi() {
  return (
    <SceneCard accent="#CA8A04">
      <div className="flex items-center justify-between">
        <SceneLabel>Viaje en curso</SceneLabel>
        <SceneChip color="#CA8A04">En curso</SceneChip>
      </div>
      <div className="mt-3 space-y-2">
        <div className="flex gap-2">
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
          <div>
            <p className="text-[10px] uppercase tracking-wide text-black/40">Origen</p>
            <p className="text-[13px] font-medium">Av. Javier Prado · San Isidro</p>
          </div>
        </div>
        <div className="ml-1 h-4 w-px bg-black/15" />
        <div className="flex gap-2">
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#CA8A04]" />
          <div>
            <p className="text-[10px] uppercase tracking-wide text-black/40">Destino</p>
            <p className="text-[13px] font-medium">Larcomar · Miraflores</p>
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-3 text-[12px]">
        <div>
          <p className="text-black/45">Conductor</p>
          <p className="font-semibold">Carlos R.</p>
        </div>
        <div className="text-right">
          <p className="text-black/45">Tarifa</p>
          <p className="font-mono text-lg font-bold text-[#CA8A04]">S/ 18.50</p>
        </div>
      </div>
    </SceneCard>
  );
}

export function SceneDelivery() {
  return (
    <SceneCard accent="#F97316">
      <div className="flex items-center justify-between">
        <SceneLabel>Encargo #882</SceneLabel>
        <SceneChip color="#F97316">Asignado</SceneChip>
      </div>
      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-1 text-center text-[11px]">
        <div className="rounded-lg bg-orange-50 px-2 py-2">
          <p className="text-[9px] uppercase text-black/40">Recojo</p>
          <p className="font-semibold leading-snug">Cevichería Norte</p>
        </div>
        <span className="text-[#F97316]">→</span>
        <div className="rounded-lg bg-orange-50 px-2 py-2">
          <p className="text-[9px] uppercase text-black/40">Entrega</p>
          <p className="font-semibold leading-snug">Oficina 402</p>
        </div>
      </div>
      <div className="mt-4 flex justify-between text-[12px]">
        <span className="text-black/50">Paquetes</span>
        <span className="font-medium">2 · 1.4 kg</span>
      </div>
      <div className="mt-1 flex justify-between text-[12px]">
        <span className="text-black/50">Repartidor</span>
        <span className="font-semibold">Luis M.</span>
      </div>
      <p className="mt-3 text-[11px] text-[#F97316]">ETA 18 min</p>
    </SceneCard>
  );
}

export function SceneFlotas() {
  return (
    <SceneCard accent="#475569">
      <div className="flex items-center justify-between">
        <SceneLabel>Unidad</SceneLabel>
        <span className="rounded border border-black/20 bg-white px-2 py-0.5 font-mono text-[13px] font-bold tracking-widest">
          ABC-918
        </span>
      </div>
      <p className="mt-3 text-[15px] font-semibold">Toyota Hiace 2022</p>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-[12px]">
        <div className="rounded-lg bg-slate-100/80 p-2.5">
          <dt className="text-[9px] uppercase tracking-wide text-black/40">SOAT</dt>
          <dd className="mt-0.5 font-semibold text-amber-700">Vence 12 días</dd>
        </div>
        <div className="rounded-lg bg-slate-100/80 p-2.5">
          <dt className="text-[9px] uppercase tracking-wide text-black/40">Odómetro</dt>
          <dd className="mt-0.5 font-mono font-semibold">84.2k km</dd>
        </div>
        <div className="col-span-2 rounded-lg bg-slate-100/80 p-2.5">
          <dt className="text-[9px] uppercase tracking-wide text-black/40">Combustible</dt>
          <dd className="mt-1.5">
            <SceneProgress value={62} color="#475569" />
            <p className="mt-1 text-[11px] text-black/50">62% · tanque medio</p>
          </dd>
        </div>
      </dl>
    </SceneCard>
  );
}

export function SceneCampo() {
  return (
    <SceneCard accent="#65A30D">
      <div className="flex items-center justify-between">
        <SceneLabel>Check-in GPS</SceneLabel>
        <SceneChip color="#65A30D">En geocerca</SceneChip>
      </div>
      <p className="mt-2 text-[15px] font-semibold">Vendedor Norte</p>
      <p className="text-[12px] text-black/45">Cliente: Boticas Lima · 11:24</p>
      <div className="relative mt-4 h-28 overflow-hidden rounded-lg bg-[#E8F5C8]">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(#65A30D22 1px, transparent 1px), linear-gradient(90deg, #65A30D22 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        />
        <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#65A30D]/50 bg-[#65A30D]/10" />
        <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-[#65A30D] shadow" />
      </div>
      <p className="mt-3 font-mono text-[11px] text-black/45">−12.119° · −77.028°</p>
    </SceneCard>
  );
}

export function SceneMantenimiento() {
  return (
    <SceneCard accent="#78716C">
      <div className="flex items-center justify-between">
        <SceneLabel>OT máquina</SceneLabel>
        <SceneChip color="#b45309">Alta</SceneChip>
      </div>
      <p className="mt-2 text-[15px] font-semibold">Prensa hidráulica #3</p>
      <p className="text-[12px] text-black/45">Correctivo · fuga de aceite</p>
      <div className="mt-4 space-y-2 text-[12px]">
        <div className="flex justify-between border-b border-black/8 pb-2">
          <span className="text-black/50">Tipo</span>
          <span className="font-medium">Correctivo</span>
        </div>
        <div className="flex justify-between border-b border-black/8 pb-2">
          <span className="text-black/50">Repuesto</span>
          <span className="font-medium">Sello P-220</span>
        </div>
        <div className="flex justify-between">
          <span className="text-black/50">Técnico</span>
          <span className="font-semibold">Técnico Demo 1</span>
        </div>
      </div>
      <div className="mt-4 space-y-1">
        <SceneLabel>Avance</SceneLabel>
        <SceneProgress value={35} color="#78716C" />
      </div>
    </SceneCard>
  );
}
