import React from "react";
import { Tabs, Tab } from "@nextui-org/react";
import ApiSunat from "./ApiSunat";
import EmpresaTab from "./EmpresaTab";

const TabsMenu = () => {
  return (
    <div className="space-y-6">
      <Tabs aria-label="Gestión de Datos">
        <Tab key="empresa" title="Empresa">
          <EmpresaTab />
        </Tab>
        <Tab key="apiSunat" title="ApiSunat">
          <ApiSunat />
        </Tab>
      </Tabs>
    </div>
  );
};

export default TabsMenu;