import { Truck, ShieldCheck, Headphones } from "lucide-react";
import { tiendaTheme, type StoreTienda } from "../../types/storefront";

type Props = {
  tienda: StoreTienda;
};

export function TrustStrip({ tienda }: Props) {
  const theme = tiendaTheme(tienda);
  const items = [
    { icon: Truck, title: theme.trust.envio, desc: "Te contactamos para la entrega" },
    { icon: ShieldCheck, title: theme.trust.pago, desc: "Checkout seguro y confiable" },
    {
      icon: Headphones,
      title: tienda.telefono ? `Soporte ${tienda.telefono}` : theme.trust.soporte,
      desc: "Habla con la tienda",
    },
  ];

  return (
    <section className="bg-white border-y border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 grid gap-6 sm:grid-cols-3">
        {items.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-start gap-3">
            <span
              className="size-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "var(--vitrina-accent-soft)", color: "var(--vitrina-accent)" }}
            >
              <Icon className="size-5" />
            </span>
            <div>
              <p className="font-semibold text-sm text-[var(--vitrina-ink)]">{title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
