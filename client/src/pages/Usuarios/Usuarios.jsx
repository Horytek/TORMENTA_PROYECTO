import { useEffect, useState, useCallback } from 'react';
import UsuariosForm from './UsuariosForm';
import { Toaster } from "react-hot-toast";
import { FaPlus } from "react-icons/fa";
import { ShowUsuarios } from '@/pages/Usuarios/ShowUsuarios';
import { Button } from "@heroui/button";
import { usePermisos } from '@/routes';
import BarraSearch from "@/components/Search/Search";
import { getUsuarios } from '@/services/usuario.services';

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [activeAdd, setModalOpen] = useState(false);
  const [rolesDict, setRolesDict] = useState({});
  const { hasCreatePermission } = usePermisos();

  // Input de búsqueda de usuarios
  const [searchTerm, setSearchTerm] = useState('');
  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  useEffect(() => {
    const fetchUsuarios = async () => {
      const data = await getUsuarios();
      setUsuarios(data);

      // Construir diccionario de roles dinámicamente
      const dict = {};
      data.forEach(u => {
        if (u.id_rol && u.nom_rol) {
          dict[u.id_rol] = u.nom_rol;
        }
      });
      setRolesDict(dict);
    };
    fetchUsuarios();
  }, []);

    // Utilidad para transformar estado_usuario y nom_rol dinámicamente
  const transformUsuario = (usuario) => ({
    ...usuario,
    estado_usuario: usuario.estado_usuario === 1 || usuario.estado_usuario === "1" ? "Activo" : "Inactivo",
    nom_rol: rolesDict[usuario.id_rol] || usuario.nom_rol || ""
  });

  // Al agregar usuario
  const addUsuario = (nuevoUsuario) => {
    setUsuarios(prev => [transformUsuario(nuevoUsuario), ...prev]);
  };

  // Actualizar usuario en el array local
  const updateUsuarioLocal = (id_usuario, updatedData) => {
    setUsuarios(prev =>
      prev.map(u =>
        u.id_usuario === id_usuario
          ? { ...u, ...transformUsuario(updatedData) }
          : u
      )
    );
  };

  // Eliminar usuario del array local
  const removeUsuario = (id_usuario) => {
    setUsuarios(prev => prev.filter(u => u.id_usuario !== id_usuario));
  };

  return (
    <div>
      <Toaster />
      <hr className="mb-4" />
      <h1 className='text-4xl font-extrabold'>Usuarios</h1>
      <div className="flex items-center justify-between mt-5 mb-4">
        <div id="barcode-scanner" hidden style={{ width: '100%', height: '400px' }}></div>
        <h6 className="font-bold">Lista de Usuarios</h6>
        <BarraSearch
          placeholder="Ingrese un usuario"
          isClearable={true}
          className="h-9 text-sm w-2/4"
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <div className="flex gap-5">
          <Button
            color="primary"
            endContent={<FaPlus style={{ fontSize: '25px' }} />}
            onClick={() => setModalOpen(true)}
            disabled={!hasCreatePermission}
            className={!hasCreatePermission ? 'opacity-50 cursor-not-allowed' : ''}
          >
            Agregar usuario
          </Button>
        </div>
      </div>
      <div>
        <ShowUsuarios
          searchTerm={searchTerm}
          usuarios={usuarios}
          addUsuario={addUsuario}
          updateUsuarioLocal={updateUsuarioLocal}
          removeUsuario={removeUsuario}
        />
      </div>
      {/* Modal de Agregar Usuario */}
      {activeAdd && (
<UsuariosForm
  modalTitle="Nuevo Usuario"
  onClose={() => setModalOpen(false)}
  onSuccess={addUsuario}
  usuarios={usuarios}
/>
      )}
    </div>
  );
}

export default Usuarios;