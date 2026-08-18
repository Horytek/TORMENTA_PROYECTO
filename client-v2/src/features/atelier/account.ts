import { useEffect, useState } from "react";
import { atelierMe } from "@/features/platform/api/atelier";
import { getAtelierSession, type AtelierSessionRole } from "./session";

const ACCOUNT_EVENT = "atelier-account";

export type AtelierMeProfile = {
  avatar_url?: string | null;
  bio?: string | null;
  intereses?: string | null;
  slug?: string;
  nombre_artistico?: string | null;
  estilos?: string | null;
  disponible?: number | boolean;
  publicado?: number | boolean;
  precio_desde?: number | string | null;
};

export type AtelierMe = {
  id_user: number;
  email: string;
  role: AtelierSessionRole;
  nombre: string;
  profile?: AtelierMeProfile | null;
};

/** Avisa al chrome (avatar / colofón) que la ficha cambió. */
export function bumpAtelierAccount() {
  window.dispatchEvent(new Event(ACCOUNT_EVENT));
}

export function useAtelierAccount() {
  const session = getAtelierSession();
  const role = session?.role;
  const [me, setMe] = useState<AtelierMe | null>(null);
  const [loading, setLoading] = useState(Boolean(role));

  useEffect(() => {
    if (!role) {
      setMe(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = () => {
      setLoading(true);
      void atelierMe(role)
        .then((r) => {
          if (!cancelled) setMe((r.data || null) as AtelierMe | null);
        })
        .catch(() => {
          if (!cancelled) setMe(null);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };
    load();
    window.addEventListener(ACCOUNT_EVENT, load);
    return () => {
      cancelled = true;
      window.removeEventListener(ACCOUNT_EVENT, load);
    };
  }, [role, session?.token]);

  return { session, role, me, loading };
}
