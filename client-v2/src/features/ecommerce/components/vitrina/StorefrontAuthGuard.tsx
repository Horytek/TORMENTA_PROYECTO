import { Navigate, useLocation, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useStorefrontAuthStore } from "../../store/useStorefrontAuthStore";
import { refreshStorefrontSession } from "../../utils/refreshStorefrontSession";

export function StorefrontAuthGuard({ children }: { children: React.ReactNode }) {
  const { slug = "" } = useParams();
  const location = useLocation();
  const token = useStorefrontAuthStore((s) => s.token);
  const user = useStorefrontAuthStore((s) => s.user);
  const hydrate = useStorefrontAuthStore((s) => s.hydrate);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    (async () => {
      if (slug) hydrate(slug);
      await refreshStorefrontSession(slug);
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, hydrate]);

  if (!ready) return null;
  if (!token || !user) {
    return (
      <Navigate
        to={`/tienda/${slug}/login`}
        replace
        state={{ from: location.pathname }}
      />
    );
  }
  return <>{children}</>;
}
