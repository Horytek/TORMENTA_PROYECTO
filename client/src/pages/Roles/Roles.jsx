import { useState } from 'react';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import UsuariosForm from './UsuariosForm';
import { Toaster } from "react-hot-toast";
import TablaRoles from './ComponentsRoles/TablaRoles';
import TablaPermisos from './ComponentsRoles/TablaPermisos';
import TablaAsignacion from './ComponentsRoles/TablaAsignacion';
import { Tabs, Tab } from "@nextui-org/react";

function Usuarios() {
  const [activeAdd, setModalOpen] = useState(false);
  const handleModalAdd = () => setModalOpen(!activeAdd);
  const [selectedTab, setSelectedTab] = useState("roles");

  return (
    <div>
      <Toaster />
      <Breadcrumb paths={[{ name: 'Inicio', href: '/inicio' }, { name: 'Roles', href: '/configuracion/roles' }]} />
      <hr className="mb-4" />
      <Tabs
        selectedKey={selectedTab}
        onSelectionChange={setSelectedTab}
        className="mb-4"
      >
        <Tab key="roles" title="Roles">
          <TablaRoles />
        </Tab>
        <Tab key="permisos" title="Permisos">
          <TablaPermisos />
        </Tab>
        <Tab key="paginas" title="Pantalla de inicio">
          <TablaAsignacion />
        </Tab>
      </Tabs>
      {activeAdd && (
        <UsuariosForm modalTitle={'Nuevo Rol'} onClose={handleModalAdd} />
      )}
    </div>
  );
}

export default Usuarios;