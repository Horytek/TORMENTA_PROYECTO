import { lazy, Suspense } from "react";
import { List, CalendarDays, BarChart3 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalesHistoryTab } from "./tabs/SalesHistoryTab";
import { SalesCalendarTab } from "./tabs/SalesCalendarTab";
// recharts vive solo aquí (pestaña "Analítica", no default) → diferido para no
// pesar en el chunk de reportes/ventas hasta que se abra esa pestaña.
const SalesCalculatorTab = lazy(() =>
  import("./tabs/SalesCalculatorTab").then((m) => ({ default: m.SalesCalculatorTab }))
);

// SalesReportPanel  3 pestañas: Historial | Calendario | Analítica

export function SalesReportPanel() {
  return (
    <Tabs defaultValue="historial" className="flex flex-col h-full">
      <TabsList className="shrink-0 bg-muted/40 backdrop-blur-md border border-border/80 p-1.5 rounded-xl h-12 w-fit gap-1.5 flex justify-start items-center ml-4 mt-3 shadow-sm">
        <TabsTrigger value="historial" className="gap-1.5 text-xs h-9 px-4 rounded-lg font-semibold transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/15 data-[state=active]:scale-[1.03] border-none">
          <List className="h-3.5 w-3.5" /> Historial
        </TabsTrigger>
        <TabsTrigger value="calendario" className="gap-1.5 text-xs h-9 px-4 rounded-lg font-semibold transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/15 data-[state=active]:scale-[1.03] border-none">
          <CalendarDays className="h-3.5 w-3.5" /> Calendario
        </TabsTrigger>
        <TabsTrigger value="analitica" className="gap-1.5 text-xs h-9 px-4 rounded-lg font-semibold transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/15 data-[state=active]:scale-[1.03] border-none">
          <BarChart3 className="h-3.5 w-3.5" /> Analítica
        </TabsTrigger>
      </TabsList>

      <TabsContent value="historial" className="flex-1 min-h-0 mt-0">
        <SalesHistoryTab />
      </TabsContent>
      <TabsContent value="calendario" className="flex-1 min-h-0 mt-0">
        <SalesCalendarTab />
      </TabsContent>
      <TabsContent value="analitica" className="flex-1 min-h-0 mt-0">
        <Suspense fallback={<div className="h-full min-h-[300px] w-full animate-pulse rounded-xl border border-border/60 bg-muted/40" />}>
          <SalesCalculatorTab />
        </Suspense>
      </TabsContent>
    </Tabs>
  );
}