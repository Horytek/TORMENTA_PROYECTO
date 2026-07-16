import { useState } from "react";
import { Terminal, Users, ListChecks, DatabaseZap, ShieldCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ModulosTab } from "../components/ModulosTab";
import { UsersPlanTab } from "../components/UsersPlanTab";
import { ActionCatalogTab } from "../components/ActionCatalogTab";
import { DatabaseCleanerTab } from "../components/DatabaseCleanerTab";
import { PermissionsAuditTab } from "../components/PermissionsAuditTab";

export default function DeveloperPage() {
  const [activeTab, setActiveTab] = useState("modulos");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Panel de Desarrollador</h1>
        <p className="text-sm text-muted-foreground">Herramientas internas de la plataforma — solo rol Desarrollador.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="modulos"><Terminal className="mr-1.5 h-4 w-4" />Módulos y Rutas</TabsTrigger>
          <TabsTrigger value="usuarios"><Users className="mr-1.5 h-4 w-4" />Usuarios y Planes</TabsTrigger>
          <TabsTrigger value="acciones"><ListChecks className="mr-1.5 h-4 w-4" />Catálogo de Acciones</TabsTrigger>
          <TabsTrigger value="auditoria"><ShieldCheck className="mr-1.5 h-4 w-4" />Auditoría de Permisos</TabsTrigger>
          <TabsTrigger value="limpiador"><DatabaseZap className="mr-1.5 h-4 w-4" />Limpiador BD</TabsTrigger>
        </TabsList>

        <TabsContent value="modulos"><ModulosTab /></TabsContent>
        <TabsContent value="usuarios"><UsersPlanTab /></TabsContent>
        <TabsContent value="acciones"><ActionCatalogTab /></TabsContent>
        <TabsContent value="auditoria"><PermissionsAuditTab /></TabsContent>
        <TabsContent value="limpiador"><DatabaseCleanerTab /></TabsContent>
      </Tabs>
    </div>
  );
}
