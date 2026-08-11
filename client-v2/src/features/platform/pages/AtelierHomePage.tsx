import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Heart, Palette, Search } from "lucide-react";
import { listAtelierCategories, listAtelierCreators } from "@/features/platform/api/atelier";
import { Input } from "@/components/ui/input";

type Creator = {
  slug: string;
  id_user?: number;
  nombre?: string;
  nombre_artistico?: string;
  bio?: string;
  avatar_url?: string;
  estilos?: string;
  precio_desde?: number;
};

export default function AtelierHomePage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [categories, setCategories] = useState<{ id_category?: number; nombre: string; slug?: string }[]>([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    void listAtelierCategories()
      .then((cat) => setCategories(cat.data || []))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (category) params.set("category", category);
    const qs = params.toString();
    void listAtelierCreators(qs ? `?${qs}` : undefined)
      .then((c) => setCreators(c.data || []))
      .catch(() => setCreators([]));
  }, [q, category]);

  return (
    <main className="min-h-dvh bg-[#FDF2F8] text-stone-900">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Link to="/atelier" className="flex items-center gap-2 font-semibold">
          <Palette className="text-[#DB2777]" />
          Atelier
        </Link>
        <Link to="/login?mode=atelier" className="rounded-full bg-[#DB2777] px-4 py-2 text-sm font-medium text-white">
          Ingresar
        </Link>
      </header>
      <section className="mx-auto max-w-6xl px-5 pb-12 pt-14 md:pb-20 md:pt-24">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[.18em] text-[#DB2777]">Arte hecho para ti</p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
          Encuentra a quien dibuje eso que imaginas.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-stone-600">
          Ilustraciones, retratos y diseños por encargo. Habla directamente con creadores independientes.
        </p>
        <Link
          to="#creadores"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white"
        >
          Explorar creadores <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
      <section className="mx-auto max-w-6xl px-5 pb-10">
        <h2 className="mb-4 text-lg font-semibold">Explora por estilo</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory("")}
            className={`rounded-full border px-4 py-2 text-sm ${!category ? "border-[#DB2777] bg-white text-[#DB2777]" : "border-[#DB2777]/15 bg-white"}`}
          >
            Todos
          </button>
          {categories.map((c) => (
            <button
              key={c.slug || c.nombre}
              type="button"
              onClick={() => setCategory(c.slug || "")}
              className={`rounded-full border px-4 py-2 text-sm ${category === c.slug ? "border-[#DB2777] bg-white text-[#DB2777]" : "border-[#DB2777]/15 bg-white"}`}
            >
              {c.nombre}
            </button>
          ))}
        </div>
        <div className="relative mt-5 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <Input
            className="bg-white pl-9"
            placeholder="Buscar por nombre o estilo…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </section>
      <section id="creadores" className="mx-auto max-w-6xl px-5 pb-16">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="text-sm font-medium text-[#DB2777]">Selección</p>
            <h2 className="text-2xl font-semibold">Creadores destacados</h2>
          </div>
          <Heart className="text-[#DB2777]" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {creators.length ? (
            creators.map((c) => (
              <Link
                key={c.slug}
                to={`/atelier/c/${c.slug}`}
                className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1"
              >
                <div
                  className="mb-5 aspect-[4/3] rounded-xl bg-gradient-to-br from-pink-100 to-orange-50"
                  style={c.avatar_url ? { backgroundImage: `url(${c.avatar_url})`, backgroundSize: "cover" } : undefined}
                />
                <h3 className="font-semibold">{c.nombre_artistico || c.nombre}</h3>
                <p className="mt-1 text-sm text-stone-500">{c.estilos || c.bio || "Ilustración por encargo"}</p>
                {c.precio_desde != null ? (
                  <p className="mt-2 text-sm font-medium text-[#DB2777]">Desde S/ {c.precio_desde}</p>
                ) : null}
              </Link>
            ))
          ) : (
            <p className="col-span-full rounded-xl bg-white p-6 text-sm text-stone-500">
              Aún no hay creadores publicados.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
