import { Check, CreditCard, Receipt, Search, ShoppingBag } from "lucide-react";
import { TAG_COLORS } from "../data/landing.data";

/**
 * Captura del producto, a escala grande.
 *
 * La landing tenía DOS imágenes y su SVG más grande medía 20px: todo eran
 * iconos de línea. Una página de software sin producto a la vista se lee como
 * un folleto de texto, por muy afinada que esté la tipografía.
 *
 * Se dibuja en JSX en vez de usar una captura PNG por tres razones: no se
 * desactualiza cuando cambia la UI, pesa cero y se adapta al tema oscuro. Y a
 * diferencia de la ilustración de stock, muestra lo que de verdad diferencia a
 * Horytek en ropa: vender por talla y color sin salir de la caja.
 */

const PRENDAS = [
  { nombre: "Polo básico algodón", precio: "39.90", color: 0, tallas: ["S", "M", "L"] },
  { nombre: "Jean slim tiro alto", precio: "89.00", color: 1, tallas: ["28", "30", "32"] },
  { nombre: "Blusa manga larga", precio: "59.90", color: 2, tallas: ["S", "M"] },
  { nombre: "Casaca denim", precio: "129.00", color: 3, tallas: ["M", "L", "XL"] },
  { nombre: "Vestido midi", precio: "119.00", color: 4, tallas: ["S", "M", "L"] },
  { nombre: "Pantalón drill", precio: "79.90", color: 5, tallas: ["30", "32"] },
];

const CARRITO = [
  { nombre: "Polo básico algodón", variante: "Talla M · Blanco", cant: 2, total: "79.80", color: 0 },
  { nombre: "Jean slim tiro alto", variante: "Talla 30 · Azul", cant: 1, total: "89.00", color: 1 },
];

export function ProductShowcase() {
  return (
    <section id="producto-real" className="lp-section lp-fill-ink">
      <div className="lp-container">
        <div className="lp-head-center">
          <span className="lp-eyebrow">Así se ve por dentro</span>
          <h2 className="lp-h2">
            La caja sabe de <span className="lp-acento">tallas y colores.</span>
          </h2>
          <p className="lp-lead">
            No es un ERP genérico con un campo de texto para la talla. La variante
            es parte de la venta, del stock y del comprobante.
          </p>
        </div>

        <div className="relative mt-12">
          <div aria-hidden className="absolute -inset-4 rounded-[20px] bg-white/[0.06] blur-2xl" />

          <div className="relative overflow-hidden rounded-xl border border-white/[0.12] bg-[#0f1720] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.7)]">
            {/* Barra de ventana */}
            <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.04] px-4 py-2.5">
              <span className="flex gap-1.5">
                <i className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <i className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <i className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
              </span>
              <span className="ml-3 rounded bg-white/[0.07] px-2.5 py-0.5 text-[10px] text-white/45">
                horytek.pe / punto-de-venta
              </span>
            </div>

            <div className="grid gap-0 lg:grid-cols-[1.55fr_1fr]">
              {/* Catálogo */}
              <div className="border-b border-white/10 p-5 lg:border-b-0 lg:border-r">
                <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2">
                  <Search className="h-3.5 w-3.5 text-white/35" aria-hidden />
                  <span className="text-[12px] text-white/35">
                    Buscar prenda o escanear código…
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {PRENDAS.map((p) => (
                    <article
                      key={p.nombre}
                      className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]"
                    >
                      <div
                        className="h-14 w-full"
                        style={{
                          background: `linear-gradient(135deg, ${TAG_COLORS[p.color]} 0%, ${TAG_COLORS[p.color]}bb 100%)`,
                        }}
                      />
                      <div className="p-2.5">
                        <p className="truncate text-[11.5px] font-medium text-white/85">
                          {p.nombre}
                        </p>
                        <p className="mt-0.5 text-[11px] font-semibold text-white">S/ {p.precio}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {p.tallas.map((t) => (
                            <span
                              key={t}
                              className="rounded border border-white/[0.15] px-1.5 py-px text-[9.5px] font-medium text-white/60"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              {/* Carrito */}
              <div className="flex flex-col p-5">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-white/50" aria-hidden />
                  <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/50">
                    Venta actual
                  </p>
                </div>

                <ul className="mt-4 space-y-3">
                  {CARRITO.map((l) => (
                    <li key={l.nombre} className="flex gap-2.5">
                      <span
                        className="mt-0.5 h-9 w-9 shrink-0 rounded"
                        style={{ background: TAG_COLORS[l.color] }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-medium text-white/90">{l.nombre}</p>
                        <p className="text-[11px] text-white/45">{l.variante}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-white/45">×{l.cant}</p>
                        <p className="text-[12px] font-semibold text-white">S/ {l.total}</p>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-5 space-y-1.5 border-t border-white/10 pt-4 text-[12px]">
                  <Linea label="Subtotal" valor="143.05" />
                  <Linea label="IGV (18%)" valor="25.75" />
                  <div className="flex justify-between pt-1.5">
                    <span className="text-[13px] font-semibold text-white">Total</span>
                    <span className="text-[17px] font-bold tracking-tight text-white">S/ 168.80</span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-1.5">
                  {["Efectivo", "Tarjeta", "Yape"].map((m, i) => (
                    <span
                      key={m}
                      className={
                        i === 1
                          ? "rounded-md bg-[hsl(var(--lp-accent))] px-2 py-2 text-center text-[11px] font-medium text-white"
                          : "rounded-md border border-white/[0.12] px-2 py-2 text-center text-[11px] font-medium text-white/55"
                      }
                    >
                      {m}
                    </span>
                  ))}
                </div>

                <div className="mt-3 flex items-center gap-2 rounded-md border border-emerald-400/25 bg-emerald-400/10 px-3 py-2.5">
                  <Check className="h-3.5 w-3.5 shrink-0 text-emerald-300" aria-hidden />
                  <p className="text-[11px] leading-snug text-emerald-100/90">
                    Boleta <span className="font-semibold">B001-00042</span> aceptada por SUNAT
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tarjetas flotantes: dan profundidad y explican el mockup sin un párrafo aparte */}
          <div className="pointer-events-none absolute -bottom-5 left-3 hidden rounded-lg border border-white/[0.12] bg-[#141d27] px-3.5 py-2.5 shadow-xl md:flex md:items-center md:gap-2.5">
            <Receipt className="h-4 w-4 text-[hsl(var(--lp-accent))]" aria-hidden />
            <div>
              <p className="text-[11px] font-semibold text-white">Comprobante en la misma venta</p>
              <p className="text-[10px] text-white/45">Sin pasar a otro sistema</p>
            </div>
          </div>
          <div className="pointer-events-none absolute -bottom-5 right-3 hidden rounded-lg border border-white/[0.12] bg-[#141d27] px-3.5 py-2.5 shadow-xl md:flex md:items-center md:gap-2.5">
            <CreditCard className="h-4 w-4 text-emerald-400" aria-hidden />
            <div>
              <p className="text-[11px] font-semibold text-white">Descuenta la talla M</p>
              <p className="text-[10px] text-white/45">No el producto genérico</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Linea({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-white/45">{label}</span>
      <span className="text-white/75">S/ {valor}</span>
    </div>
  );
}
