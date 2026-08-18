import { useEffect, useState } from "react";
import { getAtelierFileDownloadUrl, getAtelierFilePreviewUrl } from "@/features/platform/api/atelier";
import { ATELIER_COPY } from "../copy";
import { atelierApiError, formatMoneyPair, formatSol } from "../helpers";
import type { AtelierFileMeta } from "../types";
import { formatBytes } from "./FileUploader";
import { AtelierButton } from "./AtelierButton";
import { ArtworkViewer } from "./ArtworkViewer";

type Role = "cliente" | "creador";

/** Preview firmada (~10 min). Nunca pegar URL pública en src. */
export function PrivateFileCard({
  file,
  role,
  featured = false,
}: {
  file: AtelierFileMeta;
  role: Role;
  featured?: boolean;
}) {
  const unavailable = Boolean(file.deleted_at) || file.disponible === false;
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (unavailable) return;
    let cancelled = false;
    let timer = 0;
    const load = async () => {
      try {
        const r = await getAtelierFilePreviewUrl(file.id_file, role);
        if (cancelled) return;
        setSrc(r?.data?.url || null);
        setError("");
        timer = window.setTimeout(load, 8 * 60 * 1000);
      } catch (e) {
        if (!cancelled) {
          setSrc(null);
          setError(atelierApiError(e, ATELIER_COPY.fileUnavailable));
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [file.id_file, role, unavailable]);

  const download = async () => {
    try {
      const r = await getAtelierFileDownloadUrl(file.id_file, role);
      const url = r?.data?.url as string | undefined;
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(atelierApiError(e, ATELIER_COPY.fileUnavailable));
    }
  };

  if (unavailable) {
    return (
      <article className="border border-[var(--at-hairline)] bg-[var(--at-offwhite)] px-4 py-5">
        <p className="at-ui text-[14px] text-[var(--at-stone)]">{ATELIER_COPY.fileUnavailable}</p>
        <p className="at-ui mt-1 text-[12px] text-[var(--at-stone)]">{file.file_name}</p>
      </article>
    );
  }

  return (
    <article className="border border-[var(--at-hairline)] bg-[var(--at-offwhite)]">
      <div
        className="relative overflow-hidden bg-[color-mix(in_srgb,var(--at-ink)_6%,var(--at-offwhite))]"
        style={{ aspectRatio: featured ? "4/5" : "16/10" }}
      >
        {src ? (
          <button type="button" className="at-focus size-full cursor-zoom-in" onClick={() => setOpen(true)}>
            <img src={src} alt="" className="size-full object-cover" />
          </button>
        ) : (
          <div className="flex size-full items-center justify-center">
            <span className="at-ui text-[13px] text-[var(--at-stone)]">
              {error || "Preparando vista previa…"}
            </span>
          </div>
        )}
      </div>
      <div className="space-y-3 px-4 py-4">
        <div>
          <p className="at-ui truncate text-[14px] text-[var(--at-ink)]">{file.file_name}</p>
          <p className="at-ui text-[12px] text-[var(--at-stone)]">
            {file.byte_size ? formatBytes(file.byte_size) : null}
            {file.byte_size ? " · " : ""}
            {file.category === "delivery"
              ? ATELIER_COPY.artworkDone
              : file.category === "sketch"
                ? "Boceto"
                : file.category === "progress"
                  ? "Avance"
                  : "Referencia"}
          </p>
        </div>
        {error ? <p className="at-ui text-[12px] text-[var(--at-accent)]">{error}</p> : null}
        <div className="flex flex-wrap gap-2">
          {src ? (
            <AtelierButton variant="secondary" size="sm" onClick={() => setOpen(true)}>
              {ATELIER_COPY.previewArtwork}
            </AtelierButton>
          ) : null}
          <AtelierButton size="sm" onClick={() => void download()}>
            {ATELIER_COPY.downloadOriginal}
          </AtelierButton>
        </div>
      </div>
      {open && src ? (
        <ArtworkViewer
          src={src}
          title={file.file_name}
          onClose={() => setOpen(false)}
          onDownload={() => void download()}
        />
      ) : null}
    </article>
  );
}

export function feeLine(gross?: number | string, fee?: number | string, net?: number | string) {
  return `${formatMoneyPair(gross)} · comisión ${formatSol(fee)} · artista ${formatMoneyPair(net)}`;
}
