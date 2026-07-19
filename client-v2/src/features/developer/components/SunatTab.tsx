import { useState } from "react";
import { Building2, KeyRound } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { SunatEmpresasPanel } from "./SunatEmpresasPanel";
import { SunatClavesPanel } from "./SunatClavesPanel";

/**
 * Pestaña SUNAT del panel Developer — reemplaza la página /sunat del cliente v1
 * (EmpresaTab + ApiSunat): directorio de empresas con sus datos fiscales y
 * regionales, y credenciales API (tabla `clave`) por empresa.
 */
export function SunatTab() {
  const [tab, setTab] = useState("empresas");

  return (
    <Tabs value={tab} onValueChange={setTab} className="space-y-4">
      <TabsList>
        <TabsTrigger value="empresas"><Building2 className="mr-1.5 h-4 w-4" />Empresas</TabsTrigger>
        <TabsTrigger value="claves"><KeyRound className="mr-1.5 h-4 w-4" />Claves API</TabsTrigger>
      </TabsList>

      <TabsContent value="empresas"><SunatEmpresasPanel /></TabsContent>
      <TabsContent value="claves"><SunatClavesPanel /></TabsContent>
    </Tabs>
  );
}
