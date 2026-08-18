import { useId, useState, type ChangeEvent, type DragEvent } from "react";
import { cn } from "@/lib/utils";
import {
  ATELIER_FILE_ACCEPT,
  ATELIER_FILE_ACCEPT_ATTR,
  ATELIER_FILE_LIMITS,
  type AtelierFileCategory,
} from "../tokens";

export type AtelierUploadItem = {
  id: string;
  file: File;
  progress: number;
  status: "queued" | "uploading" | "done" | "error";
  error?: string;
};

type FileUploaderProps = {
  category?: AtelierFileCategory;
  items?: AtelierUploadItem[];
  onFiles?: (files: File[]) => void;
  onCancel?: (id: string) => void;
  disabled?: boolean;
  multiple?: boolean;
  className?: string;
  label?: string;
  hint?: string;
};

const CATEGORY_LABEL: Record<AtelierFileCategory, string> = {
  avatar: "Retrato",
  reference: "Referencias del brief",
  sketch: "Boceto",
  progress: "Avance de la obra",
  delivery: "Obra terminada",
};

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function validate(file: File, category: AtelierFileCategory): string | null {
  if (!ATELIER_FILE_ACCEPT.includes(file.type as (typeof ATELIER_FILE_ACCEPT)[number])) {
    return "Solo PNG, JPEG o WEBP.";
  }
  if (file.size > ATELIER_FILE_LIMITS[category]) {
    return `Máximo ${formatBytes(ATELIER_FILE_LIMITS[category])}.`;
  }
  return null;
}

/** Shell de subida con progreso. No llama API: las pantallas P1 cablean onFiles. */
export function FileUploader({
  category = "reference",
  items = [],
  onFiles,
  onCancel,
  disabled = false,
  multiple = true,
  className,
  label,
  hint,
}: FileUploaderProps) {
  const inputId = useId();
  const [over, setOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const max = ATELIER_FILE_LIMITS[category];

  function take(list: FileList | File[]) {
    const files = Array.from(list);
    const valid: File[] = [];
    let firstError: string | null = null;
    for (const file of files) {
      const err = validate(file, category);
      if (err) {
        firstError ??= err;
        continue;
      }
      valid.push(file);
    }
    setLocalError(firstError);
    if (valid.length) onFiles?.(valid);
  }

  function onInput(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files) take(e.target.files);
    e.target.value = "";
  }

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setOver(false);
    if (disabled) return;
    if (e.dataTransfer.files.length) take(e.dataTransfer.files);
  }

  return (
    <div className={cn("space-y-3", className)}>
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={cn(
          "at-focus flex min-h-36 cursor-pointer flex-col items-center justify-center border border-dashed border-[var(--at-hairline)] bg-[var(--at-offwhite)] px-6 py-8 text-center transition-colors lg:min-h-52",
          over && "border-[var(--at-ink)] bg-[color-mix(in_srgb,var(--at-paper)_70%,white)]",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <span className="at-display text-xl text-[var(--at-ink)]">
          {label ?? CATEGORY_LABEL[category]}
        </span>
        <span className="at-ui mt-2 max-w-sm text-[13px] leading-relaxed text-[var(--at-stone)]">
          {hint ?? `Suelta archivos o elige desde tu equipo. PNG, JPEG o WEBP · hasta ${formatBytes(max)}.`}
        </span>
      </label>
      <input
        id={inputId}
        type="file"
        className="sr-only"
        accept={ATELIER_FILE_ACCEPT_ATTR}
        multiple={multiple}
        disabled={disabled}
        onChange={onInput}
      />
      {localError ? <p className="at-ui text-[13px] text-[var(--at-accent)]">{localError}</p> : null}

      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="border border-[var(--at-hairline)] bg-[var(--at-offwhite)] px-3 py-2.5"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="at-ui truncate text-[13px] text-[var(--at-ink)]">{item.file.name}</p>
                  <p className="at-ui text-[11px] text-[var(--at-stone)]">{formatBytes(item.file.size)}</p>
                </div>
                {item.status === "uploading" || item.status === "queued" ? (
                  <button
                    type="button"
                    className="at-focus at-ui text-[12px] text-[var(--at-stone)] hover:text-[var(--at-ink)]"
                    onClick={() => onCancel?.(item.id)}
                  >
                    Cancelar
                  </button>
                ) : null}
              </div>
              <div
                className="mt-2 h-[2px] overflow-hidden bg-[var(--at-hairline)]"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={item.progress}
                aria-label={item.file.name}
              >
                <div
                  className="h-full bg-[var(--at-accent)] transition-[width] duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, item.progress))}%` }}
                />
              </div>
              {item.error ? <p className="at-ui mt-1.5 text-[12px] text-[var(--at-accent)]">{item.error}</p> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export { formatBytes };
