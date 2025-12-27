import { useEffect, useState, useMemo } from 'react';
import UsuariosForm from './UsuariosForm';
import { Toaster } from "react-hot-toast";
import { FaPlus } from "react-icons/fa";
import { ShowUsuarios } from '@/pages/Usuarios/ShowUsuarios';
import { usePermisos } from '@/routes';
import BarraSearch from "@/components/Search/Search";
import { getUsuarios, bulkUpdateUsuarios } from '@/services/usuario.services';
import { ActionButton } from "@/components/Buttons/Buttons";
import FilterControls from './components/FilterControls';
import { FaFileExport, FaFileExcel } from "react-icons/fa";
import { exportUsuariosLocal, filterUsuariosForExport } from '@/utils/exportUsuarios';
import UserImportModal from './UserImportModal';
import { Pagination, Select, SelectItem } from "@heroui/react";
import BulkActionsToolbar from '@/components/Shared/BulkActionsToolbar';
import ConfirmationModal from '@/components/Modals/ConfirmationModal';

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [activeAdd, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [rolesDict, setRolesDict] = useState({});
  const { hasCreatePermission } = usePermisos();

  // Pagination & Selection State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

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

  // Filtered Logic Lifted from ShowUsuarios
  const filteredUsuarios = useMemo(() => {
    if (!Array.isArray(usuarios)) return [];

    return usuarios.filter(usuario => {
      // Filtro de búsqueda
      const matchesSearch = usuario.usua.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      // Filtro de rol
      if (activeFilters.role && usuario.id_rol != activeFilters.role) {
        return false;
      }

      // Filtro de estado
      if (activeFilters.status !== undefined && activeFilters.status !== '') {
        const isActive = usuario.estado_usuario === 1 || usuario.estado_usuario === "1" || usuario.estado_usuario === "Activo";
        const filterActive = activeFilters.status === "1";
        if (isActive !== filterActive) return false;
      }

      // Filtro de conexión
      if (activeFilters.connection !== undefined && activeFilters.connection !== '') {
        const filterConnected = activeFilters.connection === "1";
        if (usuario.estado_token != (filterConnected ? 1 : 0)) return false;
      }

      return true;
    });
  }, [usuarios, searchTerm, activeFilters]);

  // Bulk Actions Logic
  const getSelectedIdsArray = () => {
    if (selectedKeys === "all") {
      return filteredUsuarios.map(u => u.id_usuario);
    }
    return Array.from(selectedKeys);
  };

  const handleBulkAction = async (action) => {
    const ids = getSelectedIdsArray();
    if (ids.length === 0) return;

    if (action === 'delete') {
      setIsBulkDeleteModalOpen(true);
      return;
    }

    executeBulkAction(action);
  };

  const executeBulkAction = async (action) => {
    const idsArray = getSelectedIdsArray();
    const success = await bulkUpdateUsuarios(action, idsArray);

    if (success) {
      if (action === 'delete') {
        idsArray.forEach(id => removeUsuario(id));
      } else {
        const numericValue = action === 'activate' ? 1 : 0;
        idsArray.forEach(id => {
          updateUsuarioLocal(id, { estado_usuario: numericValue });
        });
      }
      setSelectedKeys(new Set());
    }
    if (action === 'delete') setIsBulkDeleteModalOpen(false);
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

        {/* Table Wrapper */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm rounded-xl p-4 space-y-4">
          <ShowUsuarios
            usuarios={filteredUsuarios}
            addUsuario={addUsuario}
            updateUsuarioLocal={updateUsuarioLocal}
            removeUsuario={removeUsuario}
            selectedKeys={selectedKeys}
            onSelectionChange={setSelectedKeys}
            page={page}
            limit={limit}
          />
        </div>

        {/* Pagination Footer */}
        <div className="flex w-full justify-between items-center px-4 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm">
          <div className="flex gap-2 items-center">
            <span className="text-[12px] text-slate-400 dark:text-slate-500">
              {filteredUsuarios.length} usuarios
            </span>
            <Select
              size="sm"
              className="w-20"
              selectedKeys={[`${limit}`]}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              aria-label="Filas por página"
              classNames={{
                trigger: "min-h-8 h-8 bg-slate-50 dark:bg-zinc-800",
                value: "text-[12px]"
              }}
            >
              <SelectItem key="5">5</SelectItem>
              <SelectItem key="10">10</SelectItem>
              <SelectItem key="15">15</SelectItem>
              <SelectItem key="20">20</SelectItem>
            </Select>
          </div>

          <Pagination
            isCompact
            showControls
            showShadow
            color="primary"
            page={page}
            total={Math.ceil(filteredUsuarios.length / limit) || 1}
            onChange={setPage}
            classNames={{
              cursor: "bg-blue-600 text-white font-bold"
            }}
          />
        </div>
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

      {/* Bulk Delete Modal */}
      {isBulkDeleteModalOpen && (
        <ConfirmationModal
          message={`¿Estás seguro que deseas eliminar ${selectedKeys.size} usuarios seleccionados? Esta acción no se puede deshacer.`}
          onClose={() => setIsBulkDeleteModalOpen(false)}
          onConfirm={() => executeBulkAction('delete')}
        />
      )}

      <BulkActionsToolbar
        selectedCount={selectedKeys === "all" ? filteredUsuarios.length : selectedKeys.size}
        onActivate={() => handleBulkAction('activate')}
        onDeactivate={() => handleBulkAction('deactivate')}
        onDelete={() => handleBulkAction('delete')}
        onClearSelection={() => setSelectedKeys(new Set())}
      />
    </div>
  );
}

export default Usuarios;