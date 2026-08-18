import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { AtelierMe } from "../account";
import { ATELIER_COPY } from "../copy";
import { clearAtelierSession, destForAtelierRole, type AtelierSessionRole } from "../session";
import { ATELIER_ROUTES } from "../tokens";
import { AtelierButton } from "./AtelierButton";

function initialOf(name?: string) {
  const ch = (name || "A").trim().charAt(0);
  return ch ? ch.toUpperCase() : "A";
}

function LogoutConfirm({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="at-confirm-scrim" role="presentation" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="at-confirm"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="at-eyebrow">Cuenta</p>
        <h2 id={titleId} className="at-display at-confirm-title">
          {ATELIER_COPY.logoutConfirm}
        </h2>
        <p className="at-ui at-confirm-body">{ATELIER_COPY.logoutConfirmBody}</p>
        <div className="at-confirm-actions">
          <AtelierButton variant="tertiary" onClick={onCancel}>
            {ATELIER_COPY.logoutStay}
          </AtelierButton>
          <AtelierButton onClick={onConfirm}>{ATELIER_COPY.logoutGo}</AtelierButton>
        </div>
      </div>
    </div>
  );
}

type AccountColophonProps = {
  role: AtelierSessionRole;
  me: AtelierMe | null;
};

/** Avatar-firma: abre colofón de papel (sheet móvil / popover escritorio). */
export function AccountColophon({ role, me }: AccountColophonProps) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const name =
    me?.profile?.nombre_artistico ||
    me?.nombre ||
    (role === "admin" ? "Mesa" : role === "creador" ? "Artista" : "Cliente");
  const slug = me?.profile?.slug;
  const avatar = me?.profile?.avatar_url || undefined;
  const profileTo = role === "creador" ? ATELIER_ROUTES.studioProfile : ATELIER_ROUTES.clientProfile;
  const editTo = role === "creador" ? ATELIER_ROUTES.studioProfileEdit : ATELIER_ROUTES.clientProfileEdit;
  const isAdmin = role === "admin";

  const close = () => setOpen(false);

  const logout = () => {
    clearAtelierSession();
    window.location.assign(ATELIER_ROUTES.login);
  };

  return (
    <div className="at-colophon-wrap" ref={wrapRef}>
      <button
        type="button"
        className="at-focus at-avatar-btn"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        {avatar ? (
          <img src={avatar} alt="" className="at-avatar-img" />
        ) : (
          <span className="at-avatar-fallback at-display">{initialOf(name)}</span>
        )}
        <span className="sr-only">{ATELIER_COPY.profile}</span>
      </button>

      {open ? (
        <>
          <button type="button" className="at-colophon-scrim md:hidden" aria-label="Cerrar" onClick={close} />
          <div id={menuId} role="dialog" aria-label="Cuenta" className="at-colophon">
            <header className="at-colophon-head">
              {avatar ? (
                <img src={avatar} alt="" className="at-colophon-photo" />
              ) : (
                <span className="at-colophon-photo is-fallback at-display">{initialOf(name)}</span>
              )}
              <div className="min-w-0">
                <p className="at-display at-colophon-name">{name}</p>
                {slug ? <p className="at-ui at-colophon-slug">@{slug}</p> : null}
              </div>
            </header>
            <nav className="at-colophon-list" aria-label="Cuenta">
              {!isAdmin ? (
                <>
                  <Link className="at-colophon-link at-focus" to={profileTo} onClick={close}>
                    {ATELIER_COPY.myProfile}
                  </Link>
                  <Link className="at-colophon-link at-focus" to={editTo} onClick={close}>
                    {ATELIER_COPY.editFicha}
                  </Link>
                </>
              ) : null}
              <a className="at-colophon-link at-focus" href={ATELIER_ROUTES.helpMailto} onClick={close}>
                {ATELIER_COPY.help}
              </a>
              <button
                type="button"
                className="at-colophon-link at-focus is-leave"
                onClick={() => {
                  close();
                  setConfirm(true);
                }}
              >
                {ATELIER_COPY.logout}
              </button>
            </nav>
            <p className="at-colophon-foot">
              <Link className="at-focus" to={destForAtelierRole(role)} onClick={close}>
                {role === "admin" ? ATELIER_COPY.mesa : role === "creador" ? ATELIER_COPY.yourStudio : ATELIER_COPY.yourAtelier}
              </Link>
            </p>
          </div>
        </>
      ) : null}

      <LogoutConfirm open={confirm} onCancel={() => setConfirm(false)} onConfirm={logout} />
    </div>
  );
}
