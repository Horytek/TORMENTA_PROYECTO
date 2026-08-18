import { ATELIER_COPY } from "../copy";
import type { AtelierFileMeta } from "../types";
import { AtelierButton } from "./AtelierButton";
import { PrivateFileCard } from "./PrivateFileCard";

type Role = "cliente" | "creador";

/** Presentación de entrega: la obra, no un adjunto suelto. */
export function DeliveryPanel({
  files,
  role,
  onApprove,
  canApprove = false,
  approving = false,
}: {
  files: AtelierFileMeta[];
  role: Role;
  onApprove?: () => void;
  canApprove?: boolean;
  approving?: boolean;
}) {
  const deliveries = files.filter((f) => f.category === "delivery");
  const featured = deliveries[deliveries.length - 1] || files.filter((f) => f.category !== "reference").at(-1);

  return (
    <section className="space-y-8">
      <header className="text-center">
        <p className="at-eyebrow">{ATELIER_COPY.artworkDone}</p>
        <h2 className="at-display mt-3 text-4xl text-[var(--at-ink)] md:text-5xl">
          {ATELIER_COPY.ideaExists}
        </h2>
        <p className="at-ui mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-[var(--at-stone)]">
          La obra tiene nombre y trazo. Mírala a sangre, luego descarga el original.
        </p>
      </header>
      {featured ? <PrivateFileCard file={featured} role={role} featured /> : null}
      {canApprove && onApprove ? (
        <div className="flex justify-center">
          <AtelierButton onClick={onApprove} disabled={approving}>
            {ATELIER_COPY.approveComplete}
          </AtelierButton>
        </div>
      ) : null}
    </section>
  );
}
