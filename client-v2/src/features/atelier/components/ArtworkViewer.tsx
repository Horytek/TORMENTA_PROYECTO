import { useEffect, useRef, useState } from "react";
import { ATELIER_COPY } from "../copy";
import { AtelierButton } from "./AtelierButton";

/** Visor a sangre: passepartout de papel, no lightbox negro. Preview firmada. */
export function ArtworkViewer({
  src,
  title,
  onClose,
  onDownload,
}: {
  src: string;
  title?: string;
  onClose: () => void;
  onDownload?: () => void;
}) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="at-viewer" role="dialog" aria-modal="true" aria-label={title || ATELIER_COPY.previewArtwork}>
      <div className="at-viewer-mat">
        <img
          src={src}
          alt={title || ""}
          className="at-viewer-img"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
          draggable={false}
          onWheel={(e) => {
            e.preventDefault();
            setScale((s) => Math.min(4, Math.max(1, s + (e.deltaY < 0 ? 0.12 : -0.12))));
          }}
          onPointerDown={(e) => {
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            drag.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
          }}
          onPointerMove={(e) => {
            if (!drag.current) return;
            setOffset({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y });
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
        />
      </div>
      <div className="at-viewer-bar">
        {title ? <p className="at-display at-viewer-title">{title}</p> : <span />}
        <div className="flex flex-wrap gap-2">
          <AtelierButton variant="secondary" size="sm" onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }}>
            Encajar
          </AtelierButton>
          {onDownload ? (
            <AtelierButton size="sm" onClick={onDownload}>
              {ATELIER_COPY.downloadOriginal}
            </AtelierButton>
          ) : null}
          <AtelierButton variant="tertiary" size="sm" onClick={onClose}>
            Cerrar
          </AtelierButton>
        </div>
      </div>
    </div>
  );
}
