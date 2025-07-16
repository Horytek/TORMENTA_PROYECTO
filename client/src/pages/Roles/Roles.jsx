import { useState } from 'react';
import UsuariosForm from './UsuariosForm';
import { Toaster } from "react-hot-toast";
import TablaRoles from './ComponentsRoles/TablaRoles';
import TablaPermisos from './ComponentsRoles/TablaPermisos';
import TablaAsignacion from './ComponentsRoles/TablaAsignacion';
import { Tabs, Tab } from "@heroui/react";

function Usuarios() {
  const [activeAdd, setModalOpen] = useState(false);
  const handleModalAdd = () => setModalOpen(!activeAdd);
  const [selectedTab, setSelectedTab] = useState("roles");

  return (
    <div>
      <Toaster />
      {/* <Breadcrumb paths={[{ name: 'Inicio', href: '/inicio' }, { name: 'Roles', href: '/configuracion/roles' }]} /> */}
      <Tabs
        selectedKey={selectedTab}
        onSelectionChange={setSelectedTab}
        className="mb-8"
        classNames={{
          tabList: "bg-transparent flex gap-4",
          tab: "rounded-lg px-6 py-3 font-semibold text-base transition-colors text-blue-700 data-[selected=true]:bg-gradient-to-r data-[selected=true]:from-blue-100 data-[selected=true]:to-blue-50 data-[selected=true]:text-blue-900 data-[selected=true]:shadow data-[selected=true]:border data-[selected=true]:border-blue-200",
        }}
      >
        <Tab key="roles" title="Roles">
          <div className="bg-white/90 border border-blue-100 rounded-2xl shadow-sm p-8 min-h-[400px]">
            <TablaRoles />
          </div>
        </Tab>
        <Tab key="permisos" title="Permisos">
          <div className="bg-white/90 border border-blue-100 rounded-2xl shadow-sm p-8 min-h-[400px]">
            <TablaPermisos />
          </div>
        </Tab>
        <Tab key="paginas" title="Pantalla de inicio">
          <div className="bg-white/90 border border-blue-100 rounded-2xl shadow-sm p-8 min-h-[400px]">
            <TablaAsignacion />
          </div>
        </Tab>
      </Tabs>
      {activeAdd && (
        <UsuariosForm modalTitle={'Nuevo Rol'} onClose={handleModalAdd} />
      )}
    </div>
  );
}

export default Usuarios;