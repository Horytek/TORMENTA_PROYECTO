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
    <div className="w-full min-h-screen p-6 flex flex-col gap-6 bg-slate-50 dark:bg-zinc-950 font-sans transition-colors duration-200">
      <Toaster position="top-center" reverseOrder={false} />

      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Gestión de usuarios
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
          Visualiza, filtra y administra todos los usuarios de tu empresa, sus roles y permisos.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800">
        <div className="w-full sm:w-80">
          <BarraSearch
            placeholder="Buscar por nombre de usuario..."
            isClearable={true}
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <ActionButton
            color="green"
            icon={<FaFileExcel size={18} />}
            onClick={() => setImportModalOpen(true)}
            disabled={!hasCreatePermission}
            className="flex-1 sm:flex-none"
          >
            Importar
          </ActionButton>
          <ActionButton
            color="indigo"
            icon={<FaFileExport size={18} />}
            onClick={handleExport}
            className="flex-1 sm:flex-none"
          >
            Exportar
          </ActionButton>
          <ActionButton
            color="blue"
            icon={<FaPlus size={18} />}
            onClick={() => setModalOpen(true)}
            disabled={!hasCreatePermission}
            className="flex-1 sm:flex-none"
          >
            Nuevo usuario
          </ActionButton>
        </div>
      </div>

      {/* Advanced Filters & Table */}
      <div className="flex flex-col gap-4">
        {uniqueRoles.length > 0 && (
          <FilterControls
            roles={uniqueRoles}
            onFilterChange={setActiveFilters}
            activeFilters={activeFilters}
          />
        )}

        <ShowUsuarios
          searchTerm={searchTerm}
          activeFilters={activeFilters}
          usuarios={usuarios}
          addUsuario={addUsuario}
          updateUsuarioLocal={updateUsuarioLocal}
          removeUsuario={removeUsuario}
        />
      </div>

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