import { ReviewStars } from "./ReviewStars";

export type ReviewSummaryData = {
  total: number;
  promedio: number;
  histograma: Record<string | number, number>;
};

type Props = {
  summary: ReviewSummaryData;
  onVerTodas?: () => void;
};

export function ReviewSummary({ summary, onVerTodas }: Props) {
  const total = summary.total || 0;
  const maxBar = Math.max(1, ...[5, 4, 3, 2, 1].map((n) => Number(summary.histograma?.[n] || 0)));

  return (
    <div className="flex flex-col sm:flex-row gap-6 sm:items-start">
      <div className="shrink-0 text-center sm:text-left min-w-[7rem]">
        <p className="text-4xl font-semibold tabular-nums leading-none">
          {total ? summary.promedio.toFixed(1) : "—"}
        </p>
        <ReviewStars value={summary.promedio} size="sm" className="mt-2 justify-center sm:justify-start" />
        <p className="text-xs store-muted mt-1">
          {total} {total === 1 ? "opinión" : "opiniones"}
        </p>
      </div>
      <div className="flex-1 space-y-1.5 min-w-0">
        {[5, 4, 3, 2, 1].map((n) => {
          const count = Number(summary.histograma?.[n] || 0);
          const pct = total ? (count / maxBar) * 100 : 0;
          return (
            <div key={n} className="flex items-center gap-2 text-xs">
              <span className="w-3 tabular-nums store-muted">{n}</span>
              <div className="flex-1 h-1.5 rounded-full bg-black/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-400/90 transition-[width]"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-6 text-right tabular-nums store-muted">{count}</span>
            </div>
          );
        })}
        {onVerTodas && total > 0 && (
          <button
            type="button"
            onClick={onVerTodas}
            className="text-sm font-medium mt-2 underline-offset-2 hover:underline"
            style={{ color: "var(--vitrina-accent)" }}
          >
            Ver opiniones
          </button>
        )}
      </div>
    </div>
  );
}
