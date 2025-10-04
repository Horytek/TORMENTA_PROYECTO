import { useEffect, useState } from 'react';
import UsuariosForm from './UsuariosForm';
import { Toaster } from "react-hot-toast";
import { FaPlus } from "react-icons/fa";
import { ShowUsuarios } from '@/pages/Usuarios/ShowUsuarios';
import { Button } from '@heroui/react';
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
  <div className="min-h-screen py-8 px-2 sm:px-6">
    <Toaster />
    <h1 className="font-extrabold text-4xl text-blue-900 tracking-tight mb-2">
      Gestión de usuarios
    </h1>
    <p className="text-base text-blue-700/80 mb-4">
      Visualiza, filtra y administra todos los usuarios del sistema.
    </p>
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <BarraSearch
        placeholder="Ingrese un usuario"
        isClearable={true}
        className="h-9 text-sm w-full md:w-72"
        value={searchTerm}
        onChange={handleSearchChange}
      />
      <Button
        color="primary"
        endContent={<FaPlus style={{ fontSize: '25px' }} />}
        onClick={() => setModalOpen(true)}
        disabled={!hasCreatePermission}
        className={!hasCreatePermission ? 'opacity-50 cursor-not-allowed' : ''}
        style={{
          background: "linear-gradient(to right, #3b82f6, #6366f1)",
          color: "#fff",
          fontWeight: "bold",
          boxShadow: "0 2px 8px rgba(59,130,246,0.08)"
        }}
      >
        Agregar usuario
      </Button>
    </div>
    <ShowUsuarios
      searchTerm={searchTerm}
      usuarios={usuarios}
      addUsuario={addUsuario}
      updateUsuarioLocal={updateUsuarioLocal}
      removeUsuario={removeUsuario}
    />
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