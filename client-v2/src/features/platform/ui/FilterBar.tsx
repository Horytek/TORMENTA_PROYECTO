import { Input } from "@/components/ui/input";

type FilterBarProps = {
  query: string;
  onQueryChange: (v: string) => void;
  placeholder?: string;
  statuses?: string[];
  activeStatus: string | "all";
  onStatusChange: (v: string | "all") => void;
};

export function FilterBar({
  query,
  onQueryChange,
  placeholder = "Buscar…",
  statuses = [],
  activeStatus,
  onStatusChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Input
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder={placeholder}
        className="max-w-xs bg-white"
      />
      {statuses.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => onStatusChange("all")}
            className={`rounded px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
              activeStatus === "all"
                ? "bg-[var(--platform-accent)] text-white"
                : "bg-white text-black/55 hover:text-black"
            }`}
          >
            Todos
          </button>
          {statuses.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onStatusChange(s)}
              className={`rounded px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                activeStatus === s
                  ? "bg-[var(--platform-accent)] text-white"
                  : "bg-white text-black/55 hover:text-black"
              }`}
            >
              {s.replaceAll("_", " ")}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
