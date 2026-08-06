import { ArrowRight, Check, CheckCircle2, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ECOMMERCE_BENEFITS } from "../data/landing.data";

export function EcommerceSection() {
  return (
    <section
      id="ecommerce"
      className="relative overflow-hidden border-b border-white/10 bg-[#0c2728] py-24 text-white md:py-32"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-48 -left-32 h-96 w-96 rounded-full bg-amber-300/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-14 lg:grid-cols-[0.92fr_1.08fr] lg:gap-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              Tu tienda online
            </span>

            <h2 className="mt-5 text-balance text-[clamp(2rem,4.2vw,3.25rem)] font-semibold leading-[1.04] tracking-[-0.03em]">
              Una tienda con tu marca, lista para compartir y cobrar.
            </h2>

            <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-white/70">
              Te entregamos un nuevo canal de ventas donde tus clientes pueden ver
              productos, comprar y pagar desde el celular sin esperar una respuesta
              por chat.
            </p>

            <ul className="mt-7 space-y-3 text-[14px] text-white/85">
              {[
                "Un enlace fácil: horytek.pe/tienda/tu-marca",
                "Fotos y precios listos para comprar desde el celular",
                "Mercado Pago configurado para depositar en tu cuenta",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-300/15 text-emerald-200">
                    <Check className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Button
                asChild
                size="lg"
                className="gap-2 bg-white px-5 text-[#0c2728] hover:bg-white/90"
              >
                <Link to="/?mode=ecommerce#planes">
                  Ver planes para vender online <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <span className="text-[12px] leading-snug text-white/50">
                Planes desde S/ 79 al mes
                <br />
                sin comisión sobre tus ventas
              </span>
            </div>
          </div>

          <StorefrontPreview />
        </div>

        <div className="mt-20 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {ECOMMERCE_BENEFITS.map(({ icon: Icon, title, body }) => (
            <article key={title} className="bg-[#0c2728] p-6 lg:p-7">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-emerald-200">
                <Icon className="h-4.5 w-4.5" aria-hidden />
              </span>
              <h3 className="mt-5 text-[15px] font-semibold tracking-tight">{title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-white/55">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function StorefrontPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[580px] pb-10 sm:px-8">
      <div className="overflow-hidden rounded-2xl border border-white/15 bg-white shadow-2xl shadow-black/25">
        <div className="flex h-11 items-center gap-2 border-b border-slate-200 bg-slate-50 px-4">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
          <div className="ml-3 flex h-6 flex-1 items-center rounded-md border border-slate-200 bg-white px-3 text-[9px] text-slate-400">
            horytek.pe/tienda/tu-marca
          </div>
        </div>

        <div className="bg-[#f4f1ea] p-5 text-slate-900 sm:p-7">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#173f3e] text-white">
                <ShoppingBag className="h-3.5 w-3.5" aria-hidden />
              </span>
              <span className="text-[12px] font-bold uppercase tracking-[0.16em]">Tu marca</span>
            </div>
            <span className="rounded-full border border-slate-300 px-3 py-1 text-[9px] font-medium uppercase tracking-[0.12em]">
              Carrito · 1
            </span>
          </header>

          <div className="mt-7 grid grid-cols-[1.2fr_0.8fr] gap-3">
            <div className="rounded-xl bg-[#dce7df] p-4 sm:p-5">
              <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-emerald-900/60">
                Nueva colección
              </span>
              <p className="mt-2 max-w-[12rem] text-[clamp(1.1rem,3vw,1.7rem)] font-semibold leading-[1.05] tracking-tight text-[#173f3e]">
                Productos que hablan por tu marca.
              </p>
              <span className="mt-5 inline-flex rounded-full bg-[#173f3e] px-3 py-1.5 text-[9px] font-semibold text-white">
                Ver catálogo
              </span>
            </div>
            <div className="relative overflow-hidden rounded-xl bg-[#ddc7a8]">
              <div className="absolute inset-x-4 bottom-4 top-4 rounded-t-[44%] bg-[#b87d55] opacity-80" />
              <div className="absolute inset-x-7 bottom-4 top-9 rounded-t-[45%] border border-white/30" />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <ProductCard name="Producto esencial" price="S/ 79.90" tone="bg-[#d9d6cf]" />
            <ProductCard name="Edición especial" price="S/ 109.90" tone="bg-[#cfdedb]" />
          </div>
        </div>
      </div>

      <div className="absolute -bottom-1 left-0 rounded-xl border border-white/15 bg-[#153536] p-3.5 shadow-xl sm:left-1">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-300/15 text-emerald-200">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">Pago recibido</p>
            <p className="mt-0.5 text-[13px] font-semibold text-white">Nueva compra · S/ 109.90</p>
          </div>
        </div>
      </div>

      <div className="absolute -right-1 top-20 hidden rounded-xl border border-white/15 bg-[#153536] px-4 py-3 shadow-xl sm:block">
        <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">Producto</p>
        <p className="mt-0.5 text-[13px] font-semibold text-emerald-200">Stock actualizado</p>
      </div>
    </div>
  );
}

function ProductCard({ name, price, tone }: { name: string; price: string; tone: string }) {
  return (
    <article className="rounded-xl bg-white p-2.5">
      <div className={`h-20 rounded-lg ${tone}`} />
      <div className="mt-2 flex items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-medium text-slate-700">{name}</p>
          <p className="mt-0.5 text-[11px] font-bold text-slate-900">{price}</p>
        </div>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#173f3e] text-[13px] text-white">
          +
        </span>
      </div>
    </article>
  );
}
