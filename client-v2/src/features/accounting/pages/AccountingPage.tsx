import { useQueryState, parseAsString } from "nuqs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Receipt, TrendingUp, BookOpen, BookMarked, ListTree, Building2, CalendarClock,
  LayoutDashboard, Settings2, Landmark, PiggyBank, FileBarChart, ShieldCheck,
} from "lucide-react";
import { ExpensesPanel } from "../components/ExpensesPanel";
import { PLPanel } from "../components/PLPanel";
import { ChartOfAccountsPanel } from "../components/ChartOfAccountsPanel";
import { CostCentersPanel } from "../components/CostCentersPanel";
import { JournalEntriesPanel } from "../components/JournalEntriesPanel";
import { JournalBookPanel } from "../components/JournalBookPanel";
import { LedgerBookPanel } from "../components/LedgerBookPanel";
import { PeriodsPanel } from "../components/PeriodsPanel";
import { AccountingConfigPanel } from "../components/AccountingConfigPanel";
import { TreasuryPanel } from "../components/TreasuryPanel";
import { FinancialStatementsPanel } from "../components/FinancialStatementsPanel";
import { BudgetsPanel } from "../components/BudgetsPanel";
import { AccountingAuditPanel } from "../components/AccountingAuditPanel";
import { AccountingDashboardPanel } from "../components/AccountingDashboardPanel";

export default function AccountingPage() {
  const [tab, setTab] = useQueryState("tab", parseAsString.withDefault("resumen"));

  return (
    <div className="space-y-6 w-full animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Contabilidad</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Centro financiero: plan de cuentas, asientos de partida doble, tesorería, presupuestos y estados financieros.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full space-y-6">
        <div className="w-full overflow-x-auto scrollbar-none border-b border-border/40 pb-px">
          <TabsList variant="line" className="flex w-max gap-6 bg-transparent p-0 border-none h-10">
            <TabsTrigger value="resumen" className="gap-1.5 rounded-none text-xs font-semibold pb-3 pt-1 px-1">
              <LayoutDashboard className="h-3.5 w-3.5" /> Resumen
            </TabsTrigger>
            <TabsTrigger value="gastos" className="gap-1.5 rounded-none text-xs font-semibold pb-3 pt-1 px-1">
              <Receipt className="h-3.5 w-3.5" /> Gastos
            </TabsTrigger>
            <TabsTrigger value="pl" className="gap-1.5 rounded-none text-xs font-semibold pb-3 pt-1 px-1">
              <TrendingUp className="h-3.5 w-3.5" /> Estado de Resultados (simple)
            </TabsTrigger>
            <TabsTrigger value="plan-cuentas" className="gap-1.5 rounded-none text-xs font-semibold pb-3 pt-1 px-1">
              <ListTree className="h-3.5 w-3.5" /> Plan de Cuentas
            </TabsTrigger>
            <TabsTrigger value="centros-costo" className="gap-1.5 rounded-none text-xs font-semibold pb-3 pt-1 px-1">
              <Building2 className="h-3.5 w-3.5" /> Centros de Costo
            </TabsTrigger>
            <TabsTrigger value="asientos" className="gap-1.5 rounded-none text-xs font-semibold pb-3 pt-1 px-1">
              <BookMarked className="h-3.5 w-3.5" /> Asientos
            </TabsTrigger>
            <TabsTrigger value="libro-diario" className="gap-1.5 rounded-none text-xs font-semibold pb-3 pt-1 px-1">
              <BookOpen className="h-3.5 w-3.5" /> Libro Diario
            </TabsTrigger>
            <TabsTrigger value="libro-mayor" className="gap-1.5 rounded-none text-xs font-semibold pb-3 pt-1 px-1">
              <BookOpen className="h-3.5 w-3.5" /> Libro Mayor
            </TabsTrigger>
            <TabsTrigger value="periodos" className="gap-1.5 rounded-none text-xs font-semibold pb-3 pt-1 px-1">
              <CalendarClock className="h-3.5 w-3.5" /> Periodos
            </TabsTrigger>
            <TabsTrigger value="tesoreria" className="gap-1.5 rounded-none text-xs font-semibold pb-3 pt-1 px-1">
              <Landmark className="h-3.5 w-3.5" /> Tesorería
            </TabsTrigger>
            <TabsTrigger value="presupuestos" className="gap-1.5 rounded-none text-xs font-semibold pb-3 pt-1 px-1">
              <PiggyBank className="h-3.5 w-3.5" /> Presupuestos
            </TabsTrigger>
            <TabsTrigger value="estados-financieros" className="gap-1.5 rounded-none text-xs font-semibold pb-3 pt-1 px-1">
              <FileBarChart className="h-3.5 w-3.5" /> Estados Financieros
            </TabsTrigger>
            <TabsTrigger value="configuracion" className="gap-1.5 rounded-none text-xs font-semibold pb-3 pt-1 px-1">
              <Settings2 className="h-3.5 w-3.5" /> Configuración
            </TabsTrigger>
            <TabsTrigger value="auditoria" className="gap-1.5 rounded-none text-xs font-semibold pb-3 pt-1 px-1">
              <ShieldCheck className="h-3.5 w-3.5" /> Auditoría
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="resumen" className="focus-visible:outline-none">
          <AccountingDashboardPanel />
        </TabsContent>
        <TabsContent value="gastos" className="focus-visible:outline-none">
          <ExpensesPanel />
        </TabsContent>
        <TabsContent value="pl" className="focus-visible:outline-none">
          <PLPanel />
        </TabsContent>
        <TabsContent value="plan-cuentas" className="focus-visible:outline-none">
          <ChartOfAccountsPanel />
        </TabsContent>
        <TabsContent value="centros-costo" className="focus-visible:outline-none">
          <CostCentersPanel />
        </TabsContent>
        <TabsContent value="asientos" className="focus-visible:outline-none">
          <JournalEntriesPanel />
        </TabsContent>
        <TabsContent value="libro-diario" className="focus-visible:outline-none">
          <JournalBookPanel />
        </TabsContent>
        <TabsContent value="libro-mayor" className="focus-visible:outline-none">
          <LedgerBookPanel />
        </TabsContent>
        <TabsContent value="periodos" className="focus-visible:outline-none">
          <PeriodsPanel />
        </TabsContent>
        <TabsContent value="tesoreria" className="focus-visible:outline-none">
          <TreasuryPanel />
        </TabsContent>
        <TabsContent value="presupuestos" className="focus-visible:outline-none">
          <BudgetsPanel />
        </TabsContent>
        <TabsContent value="estados-financieros" className="focus-visible:outline-none">
          <FinancialStatementsPanel />
        </TabsContent>
        <TabsContent value="configuracion" className="focus-visible:outline-none">
          <AccountingConfigPanel />
        </TabsContent>
        <TabsContent value="auditoria" className="focus-visible:outline-none">
          <AccountingAuditPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
