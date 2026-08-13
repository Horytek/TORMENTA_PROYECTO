import { Truck, ShieldCheck, Headphones } from "lucide-react";
import { tiendaTheme, type StoreTienda } from "../../types/storefront";

type Props = {
  tienda: StoreTienda;
  items?: { title: string; subtitle?: string }[];
};

export function TrustStrip({ tienda, items }: Props) {
  const theme = tiendaTheme(tienda);
  const defaults = [
    { icon: Truck, title: theme.trust.envio, desc: "Te contactamos para la entrega" },
    { icon: ShieldCheck, title: theme.trust.pago, desc: "Checkout seguro y confiable" },
    {
      icon: Headphones,
      title: tienda.telefono ? `Soporte ${tienda.telefono}` : theme.trust.soporte,
      desc: "Habla con la tienda",
    },
  ];

  const resolved = items?.length
    ? items.map((it, i) => ({
        icon: defaults[i % 3].icon,
        title: it.title,
        desc: it.subtitle || defaults[i % 3].desc,
      }))
    : defaults;

  return (
    <section className="border-y store-hairline bg-[var(--vitrina-elevated)]">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 grid gap-6 sm:grid-cols-3">
        {resolved.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-start gap-3 rounded-[var(--store-radius)] px-1 py-0.5">
            <span
              className="size-10 flex items-center justify-center shrink-0 rounded-[var(--store-radius-sm)]"
              style={{ background: "var(--vitrina-accent-soft)", color: "var(--vitrina-accent)" }}
            >
              <Icon className="size-5" />
            </span>
            <div>
              <p className="font-semibold text-sm">{title}</p>
              <p className="text-xs store-muted mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
