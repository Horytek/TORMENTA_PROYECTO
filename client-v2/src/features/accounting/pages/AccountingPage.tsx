import { useQueryState, parseAsString } from "nuqs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Receipt, TrendingUp } from "lucide-react";
import { ExpensesPanel } from "../components/ExpensesPanel";
import { PLPanel } from "../components/PLPanel";

export default function AccountingPage() {
  const [tab, setTab] = useQueryState("tab", parseAsString.withDefault("gastos"));

  return (
    <div className="space-y-6 w-full animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Contabilidad</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Registro de gastos y Estado de Resultados (ingresos vs. egresos).
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full space-y-6">
        <TabsList className="h-11 rounded-lg bg-muted p-1">
          <TabsTrigger value="gastos" className="gap-1.5 rounded-md text-xs font-semibold">
            <Receipt className="h-3.5 w-3.5" /> Gastos
          </TabsTrigger>
          <TabsTrigger value="pl" className="gap-1.5 rounded-md text-xs font-semibold">
            <TrendingUp className="h-3.5 w-3.5" /> Estado de Resultados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gastos" className="focus-visible:outline-none">
          <ExpensesPanel />
        </TabsContent>
        <TabsContent value="pl" className="focus-visible:outline-none">
          <PLPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
