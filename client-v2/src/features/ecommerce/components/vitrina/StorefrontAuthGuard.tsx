import { Navigate, useLocation, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useStorefrontAuthStore } from "../../store/useStorefrontAuthStore";
import { buyerMe } from "../../api/ecommerce";

export function StorefrontAuthGuard({ children }: { children: React.ReactNode }) {
  const { slug = "" } = useParams();
  const location = useLocation();
  const { token, user, hydrate, setSession, clear } = useStorefrontAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (slug) hydrate(slug);
    const t = useStorefrontAuthStore.getState().token;
    if (!t) {
      setReady(true);
      return;
    }
    buyerMe(slug)
      .then((res) => {
        if (res.success && res.data?.user) {
          setSession(t, res.data.user, slug);
        } else {
          clear();
        }
      })
      .catch(() => clear())
      .finally(() => setReady(true));
  }, [slug, hydrate, setSession, clear]);

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
