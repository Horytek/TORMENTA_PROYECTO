import { SceneCard, SceneChip, SceneLabel, SceneProgress } from "./sceneShared";

export function SceneCrm() {
  const stages = [
    { name: "Lead", n: 8, hot: false },
    { name: "Qualif.", n: 5, hot: false },
    { name: "Propuesta", n: 3, hot: true },
    { name: "Ganado", n: 2, hot: false },
  ];
  return (
    <SceneCard accent="#2563EB" rotate={false}>
      <div className="flex items-center justify-between">
        <SceneLabel>Pipeline</SceneLabel>
        <span className="text-[11px] font-medium text-black/45">28 deals</span>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {stages.map((s) => (
          <div
            key={s.name}
            className="rounded-md border border-black/8 bg-white px-1 py-2 text-center"
            style={s.hot ? { boxShadow: "inset 0 0 0 1.5px #2563EB" } : undefined}
          >
            <p className="text-[8px] font-semibold uppercase tracking-wide text-black/40">{s.name}</p>
            <p className="mt-1 font-mono text-sm font-bold" style={{ color: s.hot ? "#2563EB" : undefined }}>
              {s.n}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-lg border border-[#2563EB]/30 bg-[#2563EB]/5 p-3">
        <SceneChip color="#2563EB">Destacado</SceneChip>
        <p className="mt-2 text-[13px] font-semibold">Distribuidora Andina</p>
        <p className="text-[11px] text-black/50">Propuesta · S/ 12.4k · cierra en 5 días</p>
      </div>
    </SceneCard>
  );
}

export function SceneRecluta() {
  return (
    <SceneCard accent="#BE123C">
      <SceneLabel>Vacante</SceneLabel>
      <p className="mt-1 text-[15px] font-semibold">Ejecutivo de ventas</p>
      <p className="text-[12px] text-black/45">Lima · Presencial · 47 postulaciones</p>
      <div className="mt-4 rounded-lg border border-black/10 bg-white p-3">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-semibold">Ana Torres</p>
          <SceneChip color="#BE123C">Entrevista</SceneChip>
        </div>
        <p className="mt-1 text-[11px] text-black/45">CV · 4 años retail</p>
        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-[10px] text-black/40">
            <span>Selección</span>
            <span>Etapa 3 / 5</span>
          </div>
          <SceneProgress value={60} color="#BE123C" />
        </div>
      </div>
      <p className="mt-3 text-[11px] text-black/45">8 en entrevista · 1 hire este mes</p>
    </SceneCard>
  );
}

export function SceneAcademia() {
  return (
    <SceneCard accent="#7C3AED">
      <div className="flex items-center justify-between">
        <SceneLabel>Curso</SceneLabel>
        <span className="rounded-full border border-[#7C3AED]/40 px-2 py-0.5 text-[10px] font-semibold text-[#7C3AED]">
          Certificación
        </span>
      </div>
      <p className="mt-2 text-[15px] font-semibold leading-snug">Operación POS y SUNAT</p>
      <p className="text-[12px] text-black/45">Módulo 3 · Comprobantes electrónicos</p>
      <div className="mt-4 space-y-1.5">
        <div className="flex justify-between text-[12px]">
          <span>Progreso</span>
          <span className="font-mono font-bold text-[#7C3AED]">68%</span>
        </div>
        <SceneProgress value={68} color="#7C3AED" />
      </div>
      <ul className="mt-4 space-y-1.5 text-[11px] text-black/55">
        <li className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Factura y boleta
        </li>
        <li className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" /> Notas de crédito
        </li>
                        <li className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-black/20" /> Contingencias
        </li>
      </ul>
    </SceneCard>
  );
}

export function SceneAgenda() {
  return (
    <SceneCard accent="#14B8A6">
      <div className="flex items-center justify-between">
        <SceneLabel>Hoy</SceneLabel>
        <SceneChip color="#14B8A6">Pagado</SceneChip>
      </div>
      <p className="mt-3 font-mono text-3xl font-bold tracking-tight text-[#0f766e]">16:30</p>
      <p className="text-[12px] text-black/45">45 minutos · presencial</p>
      <div className="mt-4 rounded-lg border border-black/10 bg-white/90 p-3">
        <p className="text-[10px] uppercase tracking-wide text-black/40">Cliente</p>
        <p className="text-[14px] font-semibold">Sofía Mendoza</p>
        <p className="mt-1 text-[12px] text-black/50">Consulta de marca · primera visita</p>
      </div>
      <div className="mt-3 flex gap-2 text-[11px]">
        <span className="rounded-md bg-teal-50 px-2 py-1 font-medium text-teal-800">S/ 80.00</span>
        <span className="rounded-md bg-black/5 px-2 py-1 text-black/50">Confirmada</span>
      </div>
    </SceneCard>
  );
}
