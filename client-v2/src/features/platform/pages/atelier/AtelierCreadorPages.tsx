import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { AtelierButton } from "@/features/atelier/components/AtelierButton";
import { EmptyState } from "@/features/atelier/components/EmptyState";
import { AtelierProductFrame } from "@/features/atelier/components/ProductFrame";
import { ATELIER_COPY } from "@/features/atelier/copy";
import { atelierApiError, formatMoneyPair } from "@/features/atelier/helpers";
import { ATELIER_ROUTES } from "@/features/atelier/tokens";
import ArtistBoardPage from "@/features/atelier/pages/ArtistBoardPage";
import CreatorOrdersPage from "@/features/atelier/pages/CreatorOrdersPage";
import StudioHomePage from "@/features/atelier/pages/StudioHomePage";
import AccountProfilePage from "@/features/atelier/pages/AccountProfilePage";
import WorkspacePage from "@/features/atelier/pages/WorkspacePage";
import {
  createAtelierPortfolio,
  createAtelierService,
  getAtelierWallet,
  listAtelierCreatorPortfolio,
  listAtelierCreatorServices,
} from "@/features/platform/api/atelier";

function StudioExtras({ page }: { page: "servicios" | "portafolio" | "ganancias" }) {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState("");

  const load = () => {
    const fn =
      page === "servicios"
        ? listAtelierCreatorServices
        : page === "portafolio"
          ? listAtelierCreatorPortfolio
          : getAtelierWallet;
    void fn()
      .then((r) => {
        setItems(page === "ganancias" ? [r.data || {}] : r.data || []);
        setError("");
      })
      .catch((e) => setError(atelierApiError(e, ATELIER_COPY.processInterrupted)));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <AtelierProductFrame requireRole="creador">
      <main className="at-desk-wrap">
        <p className="at-eyebrow">{ATELIER_COPY.yourStudio}</p>
        <h1 className="at-display mt-3 text-4xl">
          {page === "servicios" ? "Servicios" : page === "portafolio" ? "Portafolio" : "Ganancias"}
        </h1>
        <p className="mt-4">
          <AtelierButton variant="tertiary" asChild>
            <Link to={ATELIER_ROUTES.studio}>Volver al estudio</Link>
          </AtelierButton>
        </p>

        {error ? <EmptyState tone="error" body={error} className="px-0" /> : null}

        {page === "ganancias" && items[0] ? (
          <article className="at-gain-stack">
            <div>
              <p className="at-eyebrow">Disponible</p>
              <p className="at-display at-gain-n">{formatMoneyPair((items[0] as { available?: number }).available)}</p>
            </div>
            <div>
              <p className="at-eyebrow">Pendiente</p>
              <p className="at-display text-3xl">{formatMoneyPair((items[0] as { pending?: number }).pending)}</p>
            </div>
            <p className="at-ui text-[14px] text-[var(--at-stone)]">
              Ganado {formatMoneyPair((items[0] as { total_earned?: number }).total_earned)}
            </p>
          </article>
        ) : null}

        {page === "servicios" ? (
          <form
            className="mt-10 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              void createAtelierService({
                nombre: String(fd.get("nombre")),
                precio_base: Number(fd.get("precio_base")),
              }).then(() => {
                e.currentTarget.reset();
                load();
              });
            }}
          >
            <input
              name="nombre"
              required
              placeholder="Nombre del servicio"
              className="at-ui at-focus w-full border-b border-[var(--at-hairline)] bg-transparent py-2 outline-none"
            />
            <input
              name="precio_base"
              type="number"
              required
              min={1}
              placeholder="Precio desde"
              className="at-ui at-focus w-full border-b border-[var(--at-hairline)] bg-transparent py-2 outline-none"
            />
            <AtelierButton type="submit">Guardar servicio</AtelierButton>
          </form>
        ) : null}

        {page === "portafolio" ? (
          <form
            className="mt-10 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              void createAtelierPortfolio({
                titulo: String(fd.get("titulo")),
                image_url: String(fd.get("image_url")),
              }).then(() => {
                e.currentTarget.reset();
                load();
              });
            }}
          >
            <input
              name="titulo"
              required
              placeholder="Título de la pieza"
              className="at-ui at-focus w-full border-b border-[var(--at-hairline)] bg-transparent py-2 outline-none"
            />
            <input
              name="image_url"
              required
              type="url"
              placeholder="URL pública de portfolio (no de un encargo)"
              className="at-ui at-focus w-full border-b border-[var(--at-hairline)] bg-transparent py-2 outline-none"
            />
            <AtelierButton type="submit">Publicar en el portafolio</AtelierButton>
          </form>
        ) : null}

        {page !== "ganancias" ? (
          <ul className="mt-8 space-y-3">
            {items.map((x) => (
              <li
                key={String(x.id_service || x.id_item || x.nombre || x.titulo)}
                className="border border-[var(--at-hairline)] bg-[var(--at-offwhite)] px-4 py-3"
              >
                <p className="at-display text-lg">{String(x.nombre || x.titulo)}</p>
                {x.precio_base != null ? (
                  <p className="at-ui text-[13px] text-[var(--at-stone)]">{formatMoneyPair(x.precio_base as number)}</p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </main>
    </AtelierProductFrame>
  );
}

export default function AtelierCreadorPages() {
  const location = useLocation();
  const { id } = useParams();
  if (id && location.pathname.includes("/pedidos/")) return <WorkspacePage role="creador" />;
  if (location.pathname.includes("/perfil/editar")) return <AccountProfilePage role="creador" mode="edit" />;
  if (location.pathname.includes("/perfil")) return <AccountProfilePage role="creador" mode="view" />;
  if (location.pathname.includes("/solicitudes")) return <ArtistBoardPage />;
  if (location.pathname.includes("/pedidos")) return <CreatorOrdersPage />;
  if (location.pathname.includes("/servicios")) return <StudioExtras page="servicios" />;
  if (location.pathname.includes("/portafolio")) return <StudioExtras page="portafolio" />;
  if (location.pathname.includes("/ganancias")) return <StudioExtras page="ganancias" />;
  return <StudioHomePage />;
}
