import { useState } from "react";
import { ArrowLeftRight, EyeOff } from "lucide-react";

import { GuidedTransfersPanel } from "../components/GuidedTransfersPanel";
import { BlindInventoryPanel } from "../components/BlindInventoryPanel";

export const InventoryMovementsPage = () => {
  const [activeTab, setActiveTab] = useState<"transfers" | "blind">("transfers");

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Movimientos de Inventario</h1>
        <p className="text-sm text-gray-500 mt-1">
          Transferencias guiadas entre almacenes y auditorías con inventario físico ciego.
        </p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("transfers")}
            className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
              activeTab === "transfers"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Transferencias Guiadas</span>
          </button>

          <button
            onClick={() => setActiveTab("blind")}
            className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
              activeTab === "blind"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <EyeOff className="w-4 h-4" />
            <span>Inventario Físico Ciego</span>
          </button>
        </nav>
      </div>

      <div>
        {activeTab === "transfers" && <GuidedTransfersPanel />}
        {activeTab === "blind" && <BlindInventoryPanel />}
      </div>
    </div>
  );
};

export default InventoryMovementsPage;
