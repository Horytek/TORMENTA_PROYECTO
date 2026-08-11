import type { LandingProductModule } from "../../../modules/landingModule.types";
import { Link } from "react-router-dom";

/** Presentación ligera del marketplace Atelier dentro de Soluciones. */
export function AtelierLayout({ module }: { module: LandingProductModule }) {
  return <section className="rounded-3xl border border-pink-200 bg-[#FDF2F8] p-6 md:p-10">
    <p className="text-sm font-semibold uppercase tracking-[.16em]" style={{ color: module.accent.accent }}>Atelier</p>
    <h2 className="mt-2 text-3xl font-semibold tracking-tight">Encarga arte a tu medida.</h2>
    <p className="mt-3 max-w-2xl text-sm text-stone-600">Un marketplace directo para descubrir ilustradores, pedir cotizaciones y seguir cada entrega.</p>
    <Link to="/atelier" className="mt-6 inline-block rounded-full px-5 py-3 text-sm font-medium text-white" style={{ backgroundColor: module.accent.accent }}>Explorar Atelier</Link>
  </section>;
}
