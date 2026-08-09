const TONE: Record<string, string> = {
  solicitado: "bg-amber-100 text-amber-900",
  asignado: "bg-sky-100 text-sky-900",
  en_curso: "bg-blue-100 text-blue-900",
  en_camino: "bg-blue-100 text-blue-900",
  finalizado: "bg-emerald-100 text-emerald-900",
  entregado: "bg-emerald-100 text-emerald-900",
  cancelado: "bg-rose-100 text-rose-900",
  pendiente: "bg-amber-100 text-amber-900",
  ok: "bg-emerald-100 text-emerald-900",
  error: "bg-rose-100 text-rose-900",
  abierta: "bg-amber-100 text-amber-900",
  cerrada: "bg-emerald-100 text-emerald-900",
  creada: "bg-slate-100 text-slate-800",
  en_transito: "bg-sky-100 text-sky-900",
  entregada: "bg-emerald-100 text-emerald-900",
};

export function StatusChip({ status }: { status: string }) {
  const tone = TONE[status] || "bg-slate-100 text-slate-700";
  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${tone}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
