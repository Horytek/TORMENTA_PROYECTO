import { Package } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { POSScreen } from "../components/POS/POSScreen";
import { SalesReportPanel } from "../components/shared/SalesReportPanel";

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
            <p className="text-xs text-muted-foreground mt-0.5">Punto de venta · Registro · Reportes</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 min-h-0 px-4 pb-4">
        <Tabs defaultValue="pos" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mb-3">
            <TabsTrigger value="pos" className="gap-1.5">
              <span>🛒</span> Punto de Venta
            </TabsTrigger>
            <TabsTrigger value="report" className="gap-1.5">
              <span>📊</span> Reporte de Ventas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pos" className="flex-1 min-h-0 -mt-0.5">
            <POSScreen />
          </TabsContent>

          <TabsContent value="report" className="flex-1 min-h-0 -mt-0.5">
            <SalesReportPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
