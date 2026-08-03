import { CatalogoSettingsCard } from "../components/CatalogoSettingsCard";
import { useUserStore } from "@/store/useUserStore";

export const CatalogExpressManagePage = () => {
  const id_tenant = useUserStore((state) => state.id_tenant || state.user?.id_tenant);
  const publicUrl = `${window.location.origin}/catalogo/${id_tenant || 1}`;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Catálogo Digital & Pedidos WhatsApp</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gestiona y comparte la vitrina web pública de tu negocio para que tus clientes puedan armar su pedido y enviártelo por WhatsApp.
        </p>
      </div>

      <CatalogoSettingsCard />

      <div className="border rounded-xl bg-white shadow-sm overflow-hidden p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Vista Previa de la Vitrina Pública</h3>
          <span className="text-xs text-gray-400 font-mono">{publicUrl}</span>
        </div>
        <div className="border rounded-lg overflow-hidden h-[500px] bg-gray-50">
          <iframe src={publicUrl} className="w-full h-full border-0" title="Vista Previa del Catálogo Público" />
        </div>
      </div>
    </div>
  );
};

export default CatalogExpressManagePage;
