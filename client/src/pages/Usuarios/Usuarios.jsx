import { useEffect, useState, useMemo } from 'react';
import UsuariosForm from './UsuariosForm';
import { Toaster } from "react-hot-toast";
import { FaPlus } from "react-icons/fa";
import { ShowUsuarios } from '@/pages/Usuarios/ShowUsuarios';
import { usePermisos } from '@/routes';
import BarraSearch from "@/components/Search/Search";
import { getUsuarios } from '@/services/usuario.services';
import { ActionButton } from "@/components/Buttons/Buttons";
import FilterControls from './components/FilterControls';
import { FaFileExport, FaFileExcel } from "react-icons/fa";
import { exportUsuariosLocal, filterUsuariosForExport } from '@/utils/exportUsuarios';
import UserImportModal from './UserImportModal';

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [activeAdd, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [rolesDict, setRolesDict] = useState({});
  const { hasCreatePermission } = usePermisos();

  // Input de búsqueda de usuarios
  const [searchTerm, setSearchTerm] = useState('');
  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  // Filtros avanzados
  const [activeFilters, setActiveFilters] = useState({});

  // Extraer roles únicos para el filtro
  const uniqueRoles = useMemo(() => {
    const rolesMap = new Map();
    usuarios.forEach(u => {
      if (u.id_rol && u.nom_rol) {
        rolesMap.set(u.id_rol, { id_rol: u.id_rol, nom_rol: u.nom_rol });
      }
    });
    return Array.from(rolesMap.values());
  }, [usuarios]);

  const fetchUsuarios = async () => {
    const data = await getUsuarios();
    setUsuarios(Array.isArray(data) ? data : []);
    // Construir diccionario de roles dinámicamente
    const dict = {};
    (Array.isArray(data) ? data : []).forEach(u => {
      if (u.id_rol && u.nom_rol) {
        dict[u.id_rol] = u.nom_rol;
      }
    });
    setRolesDict(dict);
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  // Utilidad para transformar estado_usuario y nom_rol dinámicamente (solo para altas)
  const transformUsuario = (usuario) => ({
    ...usuario,
    estado_usuario:
      usuario.estado_usuario === 1 || usuario.estado_usuario === "1"
        ? "Activo"
        : "Inactivo",
    nom_rol: rolesDict[usuario.id_rol] || usuario.nom_rol || ""
  });

  // Al agregar usuario
  const addUsuario = (nuevoUsuario) => {
    setUsuarios(prev => [transformUsuario(nuevoUsuario), ...prev]);
  };

  // Actualizar usuario en el array local (no sobrescribir nom_rol si no cambió el rol)
  const updateUsuarioLocal = (id_usuario, updatedData) => {
    setUsuarios(prev =>
      prev.map(u => {
        if (u.id_usuario !== id_usuario) return u;
        const merged = { ...u, ...updatedData };

        // Si solo viene estado, mapea a texto y conserva nom_rol actual
        if (Object.prototype.hasOwnProperty.call(updatedData, 'estado_usuario')) {
          merged.estado_usuario =
            updatedData.estado_usuario === 1 || updatedData.estado_usuario === "1"
              ? "Activo"
              : "Inactivo";
        }

        // Si cambió el rol y no vino nom_rol, resolver desde diccionario
        if (
          Object.prototype.hasOwnProperty.call(updatedData, 'id_rol') &&
          !Object.prototype.hasOwnProperty.call(updatedData, 'nom_rol')
        ) {
          merged.nom_rol = rolesDict[updatedData.id_rol] || merged.nom_rol || "";
        }

        return merged;
      })
    );
  };

  // Eliminar usuario del array local
  const removeUsuario = (id_usuario) => {
    setUsuarios(prev => prev.filter(u => u.id_usuario !== id_usuario));
  };

  const handleExport = async () => {
    const filtered = filterUsuariosForExport(usuarios, searchTerm, activeFilters);
    if (!filtered.length) return;
    exportUsuariosLocal(filtered);
  };

  const handleImportSuccess = () => {
    setImportModalOpen(false);
    fetchUsuarios(); // Recargar lista
  };

  return (
    <div className="min-h-screen py-8 px-2 sm:px-6">
      <Toaster />
      <h1 className="font-extrabold text-4xl text-blue-900 dark:text-blue-100 tracking-tight mb-2">
        Gestión de usuarios
      </h1>
      <p className="text-base text-blue-700/80 dark:text-blue-300/80 mb-6">
        Visualiza, filtra y administra todos los usuarios de tu empresa.
      </p>

      {/* Search and Add Button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <BarraSearch
          placeholder="Buscar por usuario..."
          isClearable={true}
          className="h-9 text-sm w-full md:w-72"
          value={searchTerm}
          onChange={handleSearchChange}
        />

        <div className="flex items-center gap-2">
          <ActionButton
            color="green"
            icon={<FaFileExcel className="w-4 h-4" />}
            onClick={() => setImportModalOpen(true)}
            disabled={!hasCreatePermission}
            size="sm"
            className={`h-10 px-4 font-semibold rounded-lg border-0 shadow-none bg-green-50 hover:bg-green-100 text-green-700 transition-colors dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-200 ${!hasCreatePermission ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ boxShadow: "none", border: "none" }}
          >
            Importar
          </ActionButton>
          <ActionButton
            color="blue"
            icon={<FaFileExport className="w-4 h-4" />}
            onClick={handleExport}
            size="sm"
            className="h-10 px-4 font-semibold rounded-lg border-0 shadow-none bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-200"
            style={{ boxShadow: "none", border: "none" }}
          >
            Exportar
          </ActionButton>
          <ActionButton
            color="blue"
            icon={<FaPlus className="w-4 h-4 text-blue-500" />}
            onClick={() => setModalOpen(true)}
            disabled={!hasCreatePermission}
            size="sm"
            className={`h-10 px-4 font-semibold rounded-lg border-0 shadow-none bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-200 ${!hasCreatePermission ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ boxShadow: "none", border: "none" }}
          >
            Agregar usuario
          </ActionButton>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="mb-6">
        <FilterControls
          roles={uniqueRoles}
          onFilterChange={setActiveFilters}
          activeFilters={activeFilters}
        />
      </div>

      {/* Users Table */}
      <ShowUsuarios
        searchTerm={searchTerm}
        activeFilters={activeFilters}
        usuarios={usuarios}
        addUsuario={addUsuario}
        updateUsuarioLocal={updateUsuarioLocal}
        removeUsuario={removeUsuario}
      />

      {/* Add User Modal */}
      {activeAdd && (
        <UsuariosForm
          modalTitle="Nuevo Usuario"
          onClose={() => setModalOpen(false)}
          onSuccess={addUsuario}
          usuarios={usuarios}
        />
      )}

      {/* Import Modal */}
      <UserImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
}

export default Usuarios;