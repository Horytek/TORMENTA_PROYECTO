import { Package } from "lucide-react";
import { POSScreen } from "../components/POS/POSScreen";

export default function SalesPage() {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Package className="h-4.5 w-4.5 text-primary" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground leading-none">Ventas y POS</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Punto de venta</p>
          </div>
        </div>
      </div>

      {/* POS Screen */}
      <div className="flex-1 min-h-0 px-4 pb-4">
        <POSScreen />
      </div>
    </div>
  );
}
