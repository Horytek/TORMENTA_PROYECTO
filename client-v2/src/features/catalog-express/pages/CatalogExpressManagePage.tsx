import { ExternalLink, MessageCircle } from "lucide-react";
import { CatalogoSettingsCard } from "../components/CatalogoSettingsCard";
import { useUserStore } from "@/store/useUserStore";
import { Button } from "@/components/ui/button";

export const CatalogExpressManagePage = () => {
  const id_tenant = useUserStore((state) => state.id_tenant || state.user?.id_tenant);
  const publicUrl = `${window.location.origin}/catalogo/${id_tenant || 1}`;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <MessageCircle className="size-3.5" />
            Catálogo WhatsApp
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Vitrina pública de pedidos
          </h1>
          <p className="text-sm text-gray-500 mt-1.5 max-w-xl leading-relaxed">
            Tus clientes arman el pedido en la web y te llega por WhatsApp. Ideal para vender sin
            tienda online completa.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 shrink-0"
          onClick={() => window.open(publicUrl, "_blank")}
        >
          <ExternalLink className="size-4" /> Abrir vitrina
        </Button>
      </div>

      <CatalogoSettingsCard />

      <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 border-b border-stone-100 bg-stone-50/80">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Vista previa</h3>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Así ven tus clientes el catálogo en tiempo real
            </p>
          </div>
          <span className="text-[11px] text-stone-400 font-mono truncate max-w-full">{publicUrl}</span>
        </div>
        <div className="bg-stone-100/80 p-3 sm:p-4">
          <div className="rounded-xl overflow-hidden border border-stone-200 bg-white h-[min(70vh,640px)] shadow-inner">
            <iframe
              src={publicUrl}
              className="w-full h-full border-0"
              title="Vista previa del catálogo público"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CatalogExpressManagePage;
