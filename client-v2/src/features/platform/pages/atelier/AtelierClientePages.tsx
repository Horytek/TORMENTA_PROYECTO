import { useLocation, useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { AtelierButton } from "@/features/atelier/components/AtelierButton";
import { EmptyState } from "@/features/atelier/components/EmptyState";
import { AtelierProductFrame } from "@/features/atelier/components/ProductFrame";
import { ATELIER_COPY } from "@/features/atelier/copy";
import { ATELIER_ROUTES } from "@/features/atelier/tokens";
import ClientHomePage from "@/features/atelier/pages/ClientHomePage";
import ClientOrdersPage from "@/features/atelier/pages/ClientOrdersPage";
import ClientRequestPage from "@/features/atelier/pages/ClientRequestPage";
import AccountProfilePage from "@/features/atelier/pages/AccountProfilePage";
import WorkspacePage from "@/features/atelier/pages/WorkspacePage";

function FavoritesStub() {
  return (
    <AtelierProductFrame requireRole="cliente">
      <main className="at-desk-wrap">
        <EmptyState
          className="px-0"
          title="Las colecciones llegan después"
          body="Por ahora el encargo vive en Tu Atelier, no en una estantería de favoritos."
          action={
            <AtelierButton asChild>
              <Link to={ATELIER_ROUTES.clientHome}>{ATELIER_COPY.yourAtelier}</Link>
            </AtelierButton>
          }
        />
      </main>
    </AtelierProductFrame>
  );
}

export default function AtelierClientePages() {
  const location = useLocation();
  const { id } = useParams();
  if (id && location.pathname.includes("/pedidos/")) return <WorkspacePage role="cliente" />;
  if (id && location.pathname.includes("/solicitudes/")) return <ClientRequestPage />;
  if (location.pathname.includes("/perfil/editar")) return <AccountProfilePage role="cliente" mode="edit" />;
  if (location.pathname.includes("/perfil")) return <AccountProfilePage role="cliente" mode="view" />;
  if (location.pathname.includes("/favoritos")) return <FavoritesStub />;
  if (location.pathname.includes("/pedidos")) return <ClientOrdersPage />;
  return <ClientHomePage />;
}
