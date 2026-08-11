type Props = {
  disponible: number;
  className?: string;
};

export function BranchAvailabilityBadge({ disponible, className = "" }: Props) {
  let label = "Agotado";
  let tone = "bg-red-500/15 text-red-700";
  if (disponible > 5) {
    label = "Disponible";
    tone = "bg-emerald-500/15 text-emerald-700";
  } else if (disponible > 0) {
    label = `Últimas ${disponible}`;
    tone = "bg-amber-500/15 text-amber-800";
  }
  return (
    <span className={`inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full ${tone} ${className}`}>
      {label}
    </span>
  );
}
