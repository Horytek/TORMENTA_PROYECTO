import type { StoreSucursal } from "../types/storefront";
import { BranchAddressCard } from "./BranchAddressCard";

type Props = {
  sucursales: StoreSucursal[];
  title?: string;
};

export function PickupBranchesBlock({ sucursales, title = "Recojo en tienda" }: Props) {
  if (!sucursales.length) return null;
  return (
    <section id="sucursales-recojo" className="max-w-7xl mx-auto px-4 lg:px-8 py-10 scroll-mt-20">
      <h2 className="vitrina-display text-2xl sm:text-3xl mb-2">{title}</h2>
      <p className="text-sm store-muted mb-6 max-w-xl">
        Compra online y retira tu pedido en la sucursal que elijas. Por ahora solo recojo en tienda.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sucursales.map((s) => (
          <BranchAddressCard key={s.id_sucursal} sucursal={s} />
        ))}
      </div>
    </section>
  );
}
