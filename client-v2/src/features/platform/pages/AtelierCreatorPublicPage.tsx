import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  getAtelierCreator,
  listAtelierCreatorPublicPortfolio,
  listAtelierCreatorPublicServices,
} from "@/features/platform/api/atelier";

export default function AtelierCreatorPublicPage() {
  const { slug = "" } = useParams();
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    if (!slug) return;
    void Promise.all([
      getAtelierCreator(slug),
      listAtelierCreatorPublicPortfolio(slug),
      listAtelierCreatorPublicServices(slug),
    ])
      .then(([c, p, s]) => {
        setProfile(c.data || null);
        setPortfolio(p.data || []);
        setServices(s.data || []);
      })
      .catch(() => {
        setProfile(null);
        setPortfolio([]);
        setServices([]);
      });
  }, [slug]);

  return (
    <main className="min-h-dvh bg-[#FDF2F8] px-5 py-6 text-stone-900">
      <div className="mx-auto max-w-5xl">
        <Link to="/atelier" className="inline-flex items-center gap-2 text-sm text-stone-600">
          <ArrowLeft className="h-4 w-4" />
          Volver a Atelier
        </Link>
        <section className="mt-8 rounded-3xl bg-white p-7 shadow-sm">
          <p className="text-sm font-semibold text-[#DB2777]">Creador</p>
          <h1 className="mt-1 text-3xl font-semibold">
            {profile?.nombre_artistico || profile?.nombre || "Creador Atelier"}
          </h1>
          <p className="mt-3 max-w-2xl text-stone-600">{profile?.bio || "Ilustraciones hechas por encargo."}</p>
          {profile?.estilos ? <p className="mt-2 text-sm text-stone-500">Estilos: {profile.estilos}</p> : null}
          <p className="mt-2 text-sm text-stone-500">ID creador: {profile?.id_user}</p>
          <Link
            to="/atelier/cliente/solicitudes"
            className="mt-5 inline-block rounded-full bg-[#DB2777] px-5 py-3 text-sm font-medium text-white"
          >
            Solicitar un dibujo
          </Link>
        </section>
        <section className="mt-8">
          <h2 className="text-xl font-semibold">Portafolio</h2>
          <div className="mt-4 columns-1 gap-4 sm:columns-2 lg:columns-3">
            {portfolio.length ? (
              portfolio.map((p: any) => (
                <article key={p.id_item} className="mb-4 break-inside-avoid rounded-2xl bg-white p-3">
                  <div
                    className="aspect-[4/3] rounded-xl bg-pink-100"
                    style={p.image_url ? { backgroundImage: `url(${p.image_url})`, backgroundSize: "cover" } : undefined}
                  />
                  <p className="mt-2 text-sm font-medium">{p.titulo || "Ilustración"}</p>
                </article>
              ))
            ) : (
              <p className="text-sm text-stone-500">Sin piezas publicadas aún.</p>
            )}
          </div>
        </section>
        <section className="mt-8 pb-12">
          <h2 className="text-xl font-semibold">Servicios</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {services.length ? (
              services.map((s: any) => (
                <article key={s.id_service} className="rounded-xl bg-white p-4">
                  <h3 className="font-medium">{s.nombre}</h3>
                  <p className="mt-1 text-sm text-stone-500">{s.descripcion}</p>
                  <p className="mt-3 text-sm font-semibold text-[#DB2777]">Desde S/ {s.precio_base}</p>
                </article>
              ))
            ) : (
              <p className="text-sm text-stone-500">Sin servicios activos.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
