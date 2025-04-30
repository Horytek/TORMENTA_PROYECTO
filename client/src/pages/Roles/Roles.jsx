import { useState } from 'react';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import UsuariosForm from './UsuariosForm';
import { Toaster } from "react-hot-toast";
import { FaPlus } from "react-icons/fa";
import { ShowUsuarios } from '@/pages/Roles/ShowUsuarios';
import { Button } from "@nextui-org/button";
import { usePermisos } from '@/routes';
import { Tooltip } from "@nextui-org/tooltip";
import Permisos from './Permisos';

import { Tabs, Tab, Table, TableHeader, TableColumn, TableBody, Pagination } from "@nextui-org/react";
import BarraSearch from "@/components/Search/Search";

function Usuarios() {

  // Estado de Modal de Agregar Usuario
  const [activeAdd, setModalOpen] = useState(false);
  const handleModalAdd = () => {
    setModalOpen(!activeAdd);
  };

  const [usuarios, setUsuarios] = useState([]);

  const [selectedTab, setSelectedTab] = useState("roles");

  // Input de búsqueda de usuarios
  const [searchTerm, setSearchTerm] = useState('');
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const usuariosPerPage = 10;
  const filteredUsuarios = usuarios.filter(usuario =>
    usuario.nom_rol.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const indexOfLastUsuario = currentPage * usuariosPerPage;
  const indexOfFirstUsuario = indexOfLastUsuario - usuariosPerPage;
  const currentUsuarios = filteredUsuarios.slice(indexOfFirstUsuario, indexOfLastUsuario);

  const { hasCreatePermission } = usePermisos();

  const RolesContent = () => (
    <div>
      <h1 className='text-4xl font-extrabold mb-2'>Gestión de roles</h1>
      <div className="flex items-center justify-between mt-2 mb-4">
        <h6 className="font-bold">Lista de Roles</h6>
        <BarraSearch
          placeholder="Ingrese un rol"
          isClearable={true}
          className="h-9 text-sm w-2/4"
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <div className="flex gap-5">
          <Tooltip content={hasCreatePermission ? "Agregar rol" : "No tiene permisos para agregar roles"}>
            <Button
              color={hasCreatePermission ? "primary" : "default"}
              endContent={<FaPlus style={{ fontSize: '25px' }} />}
              onClick={() => hasCreatePermission ? handleModalAdd() : null}
              className={hasCreatePermission ? "" : "opacity-50 cursor-not-allowed"}
            >
              Agregar rol
            </Button>
          </Tooltip>
        </div>
      </div>
      <Table
        isStriped
        aria-label="Usuarios"
        className="min-w-full border-collapse"
      >
        <TableHeader>
          <TableColumn>ID</TableColumn>
          <TableColumn>ROL</TableColumn>
          <TableColumn>ESTADO</TableColumn>
          <TableColumn className="w-32 text-center">ACCIONES</TableColumn>
        </TableHeader>
        <TableBody>
          {currentUsuarios.map((usuario) => (
            <TableRow key={usuario.id_rol}>
              {["id", "rol", "estado", "acciones"].map((columnKey) => (
                <TableCell key={columnKey}>{renderCell(usuario, columnKey)}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex justify-end mt-4">
        <Pagination
          showControls
          currentPage={currentPage}
          totalPages={Math.ceil(filteredUsuarios.length / usuariosPerPage)}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );

  const PermisosContent = () => (
      <Permisos searchTerm={searchTerm} />
    );


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
          <RolesContent />
        </Tab>
        <Tab key="permisos" title="Permisos">
          <PermisosContent />
        </Tab>
      </Tabs>
      {/* El resto del código, como el modal */}
      {activeAdd && (
        <UsuariosForm modalTitle={'Nuevo Rol'} onClose={handleModalAdd} />
      )}
    </div>
  );
}

export default Usuarios;