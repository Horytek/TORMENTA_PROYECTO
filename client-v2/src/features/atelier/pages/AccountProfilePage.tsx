import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  updateAtelierClientProfile,
  updateAtelierCreatorProfile,
} from "@/features/platform/api/atelier";
import { bumpAtelierAccount, useAtelierAccount, type AtelierMe } from "../account";
import { atelierApiError } from "../helpers";
import { ATELIER_COPY } from "../copy";
import { ATELIER_ROUTES } from "../tokens";
import { AtelierButton } from "../components/AtelierButton";
import { EmptyState } from "../components/EmptyState";
import { AtelierProductFrame } from "../components/ProductFrame";

function initialOf(name?: string) {
  const ch = (name || "A").trim().charAt(0);
  return ch ? ch.toUpperCase() : "A";
}

function displayName(me: AtelierMe | null, role: "cliente" | "creador") {
  if (!me) return role === "creador" ? "Artista" : "Cliente";
  return me.profile?.nombre_artistico || me.nombre || (role === "creador" ? "Artista" : "Cliente");
}

function ProfileView({ role, me }: { role: "cliente" | "creador"; me: AtelierMe }) {
  const name = displayName(me, role);
  const avatar = me.profile?.avatar_url || undefined;
  const slug = me.profile?.slug;
  const editTo = role === "creador" ? ATELIER_ROUTES.studioProfileEdit : ATELIER_ROUTES.clientProfileEdit;
  const publicTo = slug ? ATELIER_ROUTES.artist(slug) : null;

  return (
    <article className="at-ficha">
      <p className="at-eyebrow">{role === "creador" ? ATELIER_COPY.yourStudio : ATELIER_COPY.yourAtelier}</p>
      <header className="at-ficha-head">
        {avatar ? (
          <img src={avatar} alt="" className="at-ficha-photo" />
        ) : (
          <span className="at-ficha-photo is-fallback at-display">{initialOf(name)}</span>
        )}
        <div className="min-w-0">
          <h1 className="at-display at-ficha-title">{name}</h1>
          {slug ? <p className="at-ui at-ficha-slug">@{slug}</p> : null}
        </div>
      </header>

      <dl className="at-ficha-meta">
        <div>
          <dt>Correo</dt>
          <dd>{me.email}</dd>
        </div>
        {me.profile?.bio ? (
          <div>
            <dt>Nota</dt>
            <dd>{me.profile.bio}</dd>
          </div>
        ) : null}
        {role === "cliente" && me.profile?.intereses ? (
          <div>
            <dt>Intereses</dt>
            <dd>{me.profile.intereses}</dd>
          </div>
        ) : null}
        {role === "creador" && me.profile?.estilos ? (
          <div>
            <dt>Estilos</dt>
            <dd>{me.profile.estilos}</dd>
          </div>
        ) : null}
        {role === "creador" ? (
          <div>
            <dt>Encargos</dt>
            <dd>{me.profile?.disponible === false || me.profile?.disponible === 0 ? "No acepto encargos ahora" : "Disponible"}</dd>
          </div>
        ) : null}
      </dl>

      <p className="at-ficha-actions">
        <AtelierButton asChild>
          <Link to={editTo}>{ATELIER_COPY.editFicha} ficha</Link>
        </AtelierButton>
        {publicTo ? (
          <AtelierButton variant="tertiary" asChild>
            <Link to={publicTo}>Ver ficha pública</Link>
          </AtelierButton>
        ) : null}
      </p>
    </article>
  );
}

function ClientEditForm({ me }: { me: AtelierMe }) {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSaving(true);
    setError("");
    void updateAtelierClientProfile({
      nombre: String(fd.get("nombre") || "").trim(),
      avatar_url: String(fd.get("avatar_url") || "").trim() || null,
      bio: String(fd.get("bio") || "").trim() || null,
      intereses: String(fd.get("intereses") || "").trim() || null,
    })
      .then(() => {
        bumpAtelierAccount();
        navigate(ATELIER_ROUTES.clientProfile);
      })
      .catch((err) => setError(atelierApiError(err, ATELIER_COPY.processInterrupted)))
      .finally(() => setSaving(false));
  };

  return (
    <form className="at-ficha-form" onSubmit={onSubmit}>
      <p className="at-eyebrow">{ATELIER_COPY.yourAtelier}</p>
      <h1 className="at-display at-ficha-title">Tu ficha</h1>
      <label className="at-field">
        <span>Nombre</span>
        <input name="nombre" required defaultValue={me.nombre} maxLength={120} className="at-field-input at-focus" />
      </label>
      <label className="at-field">
        <span>Retrato (URL)</span>
        <input
          name="avatar_url"
          type="url"
          defaultValue={me.profile?.avatar_url || ""}
          placeholder="https://"
          className="at-field-input at-focus"
        />
      </label>
      <label className="at-field">
        <span>Nota</span>
        <textarea name="bio" rows={4} maxLength={500} defaultValue={me.profile?.bio || ""} className="at-field-input at-focus" />
      </label>
      <label className="at-field">
        <span>Intereses</span>
        <input
          name="intereses"
          defaultValue={me.profile?.intereses || ""}
          maxLength={500}
          className="at-field-input at-focus"
        />
      </label>
      {error ? <p className="at-ui text-[14px] text-[var(--at-accent)]">{error}</p> : null}
      <div className="at-ficha-actions">
        <AtelierButton type="submit" disabled={saving}>
          {saving ? "Guardando…" : "Guardar ficha"}
        </AtelierButton>
        <AtelierButton variant="tertiary" asChild>
          <Link to={ATELIER_ROUTES.clientProfile}>Cancelar</Link>
        </AtelierButton>
      </div>
    </form>
  );
}

function CreatorEditForm({ me }: { me: AtelierMe }) {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSaving(true);
    setError("");
    void updateAtelierCreatorProfile({
      nombre: String(fd.get("nombre") || "").trim(),
      nombre_artistico: String(fd.get("nombre_artistico") || "").trim(),
      slug: String(fd.get("slug") || "").trim(),
      avatar_url: String(fd.get("avatar_url") || "").trim() || null,
      bio: String(fd.get("bio") || "").trim() || null,
      estilos: String(fd.get("estilos") || "").trim() || null,
      disponible: fd.get("disponible") === "on",
    })
      .then(() => {
        bumpAtelierAccount();
        navigate(ATELIER_ROUTES.studioProfile);
      })
      .catch((err) => setError(atelierApiError(err, ATELIER_COPY.processInterrupted)))
      .finally(() => setSaving(false));
  };

  return (
    <form className="at-ficha-form" onSubmit={onSubmit}>
      <p className="at-eyebrow">{ATELIER_COPY.yourStudio}</p>
      <h1 className="at-display at-ficha-title">Ficha del estudio</h1>
      <label className="at-field">
        <span>Nombre</span>
        <input name="nombre" required defaultValue={me.nombre} maxLength={120} className="at-field-input at-focus" />
      </label>
      <label className="at-field">
        <span>Nombre artístico</span>
        <input
          name="nombre_artistico"
          required
          defaultValue={me.profile?.nombre_artistico || ""}
          maxLength={120}
          className="at-field-input at-focus"
        />
      </label>
      <label className="at-field">
        <span>Slug público</span>
        <input
          name="slug"
          required
          defaultValue={me.profile?.slug || ""}
          pattern="[a-z0-9.-]+"
          className="at-field-input at-focus"
        />
      </label>
      <label className="at-field">
        <span>Retrato (URL)</span>
        <input
          name="avatar_url"
          type="url"
          defaultValue={me.profile?.avatar_url || ""}
          placeholder="https://"
          className="at-field-input at-focus"
        />
      </label>
      <label className="at-field">
        <span>Bio</span>
        <textarea name="bio" rows={5} defaultValue={me.profile?.bio || ""} className="at-field-input at-focus" />
      </label>
      <label className="at-field">
        <span>Estilos</span>
        <input name="estilos" defaultValue={me.profile?.estilos || ""} maxLength={500} className="at-field-input at-focus" />
      </label>
      <label className="at-field-check">
        <input name="disponible" type="checkbox" defaultChecked={Boolean(me.profile?.disponible ?? true)} />
        <span>Disponible para encargos</span>
      </label>
      {error ? <p className="at-ui text-[14px] text-[var(--at-accent)]">{error}</p> : null}
      <div className="at-ficha-actions">
        <AtelierButton type="submit" disabled={saving}>
          {saving ? "Guardando…" : "Guardar ficha"}
        </AtelierButton>
        <AtelierButton variant="tertiary" asChild>
          <Link to={ATELIER_ROUTES.studioProfile}>Cancelar</Link>
        </AtelierButton>
      </div>
    </form>
  );
}

type AccountProfilePageProps = {
  role: "cliente" | "creador";
  mode: "view" | "edit";
};

/** Perfil privado: ficha/colofón, no lista de ajustes. El correo no sale en /atelier/c/:slug. */
export default function AccountProfilePage({ role, mode }: AccountProfilePageProps) {
  const { me, loading } = useAtelierAccount();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [mode]);

  return (
    <AtelierProductFrame requireRole={role}>
      <main className="at-desk-wrap">
        {loading && !me ? (
          <p className="at-ui text-[var(--at-stone)]">Abriendo la ficha…</p>
        ) : !me ? (
          <EmptyState tone="error" />
        ) : mode === "edit" ? (
          role === "creador" ? <CreatorEditForm me={me} /> : <ClientEditForm me={me} />
        ) : (
          <ProfileView role={role} me={me} />
        )}
      </main>
    </AtelierProductFrame>
  );
}
