import { useState } from "react";
import { History, BarChart3 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalesReportPanel } from "@/features/sales/components/shared/SalesReportPanel";
import { ManagementReportsPanel } from "../components/ManagementReportsPanel";

/**
 * Historial de ventas + reportes gerenciales (/reports). El historial reusa
 * el panel de `sales` (sin cambios); "Gerencial" conecta reportes agregados
 * que ya existían en el backend (reporte.controller.js) sin consumidor.
 */
export default function ReportsPage() {
  const [tab, setTab] = useState("historial");

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="shrink-0 pb-3">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Reportes</h1>
        <p className="text-sm text-muted-foreground mt-1">Historial de comprobantes y análisis gerencial del negocio.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="flex-1 min-h-0 flex flex-col">
        <TabsList className="h-10 w-fit shrink-0 rounded-lg bg-muted p-1">
          <TabsTrigger value="historial" className="gap-1.5 rounded-md text-xs font-semibold">
            <History className="h-3.5 w-3.5" /> Historial
          </TabsTrigger>
          <TabsTrigger value="gerencial" className="gap-1.5 rounded-md text-xs font-semibold">
            <BarChart3 className="h-3.5 w-3.5" /> Gerencial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="historial" className="flex-1 min-h-0 mt-3 focus-visible:outline-none">
          <SalesReportPanel />
        </TabsContent>

        <TabsContent value="gerencial" className="flex-1 min-h-0 mt-3 overflow-y-auto focus-visible:outline-none">
          <ManagementReportsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
