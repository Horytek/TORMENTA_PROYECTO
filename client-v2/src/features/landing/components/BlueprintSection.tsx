import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CreditCard,
  Image as ImageIcon,
  Link2,
  LockKeyhole,
  MessageCircle,
  ScanLine,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import { POCKET_BLUEPRINT_CARDS, type Mode } from "../data/landing.data";

interface Props {
  mode: Mode;
}

const POCKET_ICONS = [ScanLine, Wallet, BarChart3];

export function BlueprintSection({ mode }: Props) {
  if (mode !== "pocket") return <CustomerJourney />;

  return (
    <section id="producto" className="border-b border-border/60 bg-amber-500/[0.03] py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="inline-flex rounded-full border border-amber-500/30 bg-amber-500/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-amber-700 dark:text-amber-400">
            Simple y rápido
          </span>
          <h2 className="lp-h2">
            Todo lo que necesitas.
            <br />
            <span className="text-amber-600">Nada que te sobre.</span>
          </h2>
          <p className="mt-4 text-balance text-[15px] leading-relaxed text-muted-foreground">
            Pocket está pensado para que empieces a vender desde tu celular sin
            manuales largos ni equipos adicionales.
          </p>
        </div>

        <PocketCards />
      </div>
    </section>
  );
}

function CustomerJourney() {
  return (
    <section id="producto" className="relative overflow-hidden border-b border-border/60 bg-secondary/25 py-24 md:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-brand/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="lp-eyebrow">
            Así compra tu cliente
          </span>
          <h2 className="lp-h2">
            Compartes un enlace. Tu cliente elige. El pago llega a ti.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            Sin pedir precios por chat ni coordinar cada pago manualmente. Tu tienda
            acompaña al cliente desde el primer clic hasta la compra.
          </p>
        </div>

        <div className="mt-14 grid items-center gap-12 lg:grid-cols-[0.88fr_1.12fr] lg:gap-20">
          <ol className="space-y-5">
            <JourneyStep
              n="01"
              icon={MessageCircle}
              title="Descubre tu tienda"
              body="Compartes tu enlace en WhatsApp, Instagram o donde ya conversas con tus clientes."
            />
            <JourneyStep
              n="02"
              icon={ShoppingBag}
              title="Elige sin preguntar"
              body="Ve fotos, precios y productos disponibles; agrega lo que quiere al carrito desde su celular."
            />
            <JourneyStep
              n="03"
              icon={CreditCard}
              title="Paga y confirma"
              body="Configuramos Mercado Pago para que el cliente pague en el carrito y el dinero llegue a tu cuenta."
            />
          </ol>

          <CheckoutPreview />
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
          <SimpleBenefit
            icon={Link2}
            title="Un enlace fácil de recordar"
            body="Te entregamos una dirección como horytek.pe/tienda/tu-marca para compartirla en segundos."
          />
          <SimpleBenefit
            icon={ImageIcon}
            title="Fotos que cargan rápido"
            body="Optimizamos las imágenes para que tu catálogo se vea bien incluso desde el celular."
          />
          <SimpleBenefit
            icon={LockKeyhole}
            title="Tu negocio está protegido"
            body="Tus ventas y productos permanecen separados de los datos de cualquier otra tienda."
          />
        </div>
      </div>
    </section>
  );
}

function JourneyStep({
  n,
  icon: Icon,
  title,
  body,
}: {
  n: string;
  icon: typeof ShoppingBag;
  title: string;
  body: string;
}) {
  return (
    <li className="group flex gap-4 rounded-xl border border-transparent p-4 transition-colors hover:border-border hover:bg-card">
      <span className="num mt-1 text-[11px] font-semibold text-brand">{n}</span>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
        <Icon className="h-4.5 w-4.5" aria-hidden />
      </span>
      <div>
        <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </li>
  );
}

function CheckoutPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[560px] pb-8 sm:px-8">
      <div className="overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-[0_22px_60px_-30px_hsl(var(--foreground)/0.35)]">
        <div className="flex items-center gap-2 border-b border-border bg-secondary/50 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
          <div className="ml-2 flex flex-1 items-center rounded-md border border-border bg-background px-3 py-1.5 text-[9px] text-muted-foreground">
            horytek.pe/tienda/tu-marca
          </div>
        </div>

        <div className="grid sm:grid-cols-[1fr_0.9fr]">
          <div className="border-b border-border p-5 sm:border-b-0 sm:border-r sm:p-6">
            <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-brand">Tu marca</span>
            <div className="mt-4 rounded-xl bg-[#dce7df] p-4">
              <div className="h-28 rounded-lg bg-[#b8cbc1]" />
              <p className="mt-3 text-[12px] font-semibold text-foreground">Producto favorito</p>
              <p className="mt-1 text-[14px] font-bold text-foreground">S/ 89.90</p>
              <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[9px] font-semibold text-primary-foreground">
                Agregar al carrito <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </div>

          <div className="flex flex-col p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-foreground">Tu compra</p>
              <span className="rounded-full bg-secondary px-2 py-1 text-[8px] font-semibold text-muted-foreground">1 producto</span>
            </div>
            <div className="mt-5 space-y-3 text-[10px]">
              <div className="flex justify-between text-muted-foreground"><span>Producto</span><span>S/ 89.90</span></div>
              <div className="border-t border-dashed border-border pt-3">
                <div className="flex justify-between text-[12px] font-semibold text-foreground"><span>Total</span><span>S/ 89.90</span></div>
              </div>
            </div>
            <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-3 text-blue-950 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-100">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" aria-hidden />
                <span className="text-[10px] font-semibold">Pagar con Mercado Pago</span>
              </div>
              <p className="mt-1.5 text-[9px] leading-relaxed opacity-70">El pago se deposita en la cuenta del negocio.</p>
            </div>
            <span className="mt-3 flex items-center justify-center gap-1.5 text-[9px] text-emerald-600">
              <CheckCircle2 className="h-3 w-3" /> Compra protegida
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SimpleBenefit({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Link2;
  title: string;
  body: string;
}) {
  return (
    <article className="bg-card p-6 md:p-7">
      <Icon className="h-5 w-5 text-brand" aria-hidden />
      <h3 className="mt-4 text-[14px] font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">{body}</p>
    </article>
  );
}

function PocketCards() {
  return (
    <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
      {POCKET_BLUEPRINT_CARDS.map((card, i) => {
        const Icon = POCKET_ICONS[i] ?? ScanLine;
        return (
          <article
            key={card.title}
            className="group flex flex-col items-center rounded-xl border border-border bg-card p-8 text-center transition-colors hover:border-amber-500/40"
          >
            <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-amber-500/10 text-amber-600 transition-transform group-hover:scale-110">
              <Icon className="h-6 w-6" aria-hidden />
            </span>
            <h3 className="text-[16px] font-semibold tracking-tight text-foreground">{card.title}</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{card.body}</p>
          </article>
        );
      })}
    </div>
  );
}
