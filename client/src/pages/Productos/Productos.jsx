import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Toaster, toast } from "react-hot-toast";
import { FaPlus, FaFileExcel, FaFileExport } from "react-icons/fa";
import {
  Button, Tabs, Tab, Modal, ModalContent, ModalHeader,
  ModalBody, ModalFooter, Dropdown, DropdownTrigger,
  DropdownMenu, DropdownItem
} from "@heroui/react";
import * as XLSX from 'xlsx';

// Rutas y Servicios
import { usePermisos } from '@/routes';
import { getProductos, importExcel as importProductos } from '@/services/productos.services';
import { getMarcas, importExcel as importMarcas } from '@/services/marca.services';
import { getCategorias, importExcel as importCategorias } from '@/services/categoria.services';
import { getSubcategoriaNomCategoria, importExcel as importSubcategorias } from '@/services/subcategoria.services';
import { generateExcel, generateExcelTemplate } from '@/utils/excelExport';
import { ActionButton } from "@/components/Buttons/Buttons";
// Componentes
import BarraSearch from "@/components/Search/Search";
import ProductosForm from './ProductosForm';
import { ShowProductos } from './ShowProductos';
import Marcas from '../Marcas/Marcas';
import Categorias from '../Categorias/Categorias';
import Subcategorias from '../Subcategorias/Subcategorias';

// --- 1. CUSTOM HOOK: Manejo de Datos ---
const useInventoryData = () => {
  const [data, setData] = useState({
    productos: [],
    marcas: [],
    categorias: [],
    subcategorias: []
  });
  const [loaded, setLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Carga inicial de datos (Optimizada)
  useEffect(() => {
    if (loaded) return;

    const loadData = async () => {
      try {
        setIsLoading(true);

        // 1. Cargar Productos (Prioridad para mostrar la UI rápido)
        const prod = await getProductos();
        setData(prev => ({ ...prev, productos: prod || [] }));
        setIsLoading(false); // Desbloquear UI inmediatamente

        // 2. Cargar el resto en segundo plano
        const [marc, cat, sub] = await Promise.all([
          getMarcas(),
          getCategorias(),
          getSubcategoriaNomCategoria()
        ]);

        setData(prev => ({
          ...prev,
          marcas: marc || [],
          categorias: cat || [],
          subcategorias: sub || []
        }));

        setLoaded(true);
      } catch (error) {
        console.error("Error cargando inventario");
        setIsLoading(false);
      }
    };

    loadData();
  }, [loaded]);

  // Helpers para actualizar estado local (CRUD optimista)
  const createOperations = (key, idField) => ({
    add: (item) => setData(prev => ({ ...prev, [key]: [item, ...prev[key]] })),
    update: (id, item) => setData(prev => ({
      ...prev,
      [key]: prev[key].map(el => el[idField] === id ? { ...el, ...item } : el)
    })),
    remove: (id) => setData(prev => ({
      ...prev,
      [key]: prev[key].filter(el => el[idField] !== id)
    }))
  });

  return {
    data,
    isLoading,
    ops: {
      productos: createOperations('productos', 'id_producto'),
      marcas: createOperations('marcas', 'id_marca'),
      categorias: createOperations('categorias', 'id_categoria'),
      subcategorias: createOperations('subcategorias', 'id_subcategoria'),
    },
    reloadData: () => setLoaded(false) // Force reload
  };
};

// --- 2. COMPONENTE: Modal de Importación ---
const ImportDataModal = ({ isOpen, onClose, type, onImport }) => (
  <Modal isOpen={isOpen} onClose={onClose} size="md" className="dark:bg-gray-900 dark:text-white">
    <ModalContent>
      <ModalHeader className="flex items-center gap-2 dark:border-b dark:border-gray-700">
        <FaFileExcel className="text-green-600 w-6 h-6" />
        Importar {type ? type.charAt(0).toUpperCase() + type.slice(1) : ''}
      </ModalHeader>
      <ModalBody>
        <div className="flex flex-col items-center justify-center gap-4 py-2 text-center">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Selecciona el archivo Excel con la plantilla correspondiente.<br />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Asegúrate de que el archivo contenga datos válidos (Max 500 filas).<br />
              <strong>Nota:</strong> Para el campo "Estado", usa 1 (Activo) o 0 (Inactivo).
            </span>
          </p>
          <input id="import-file-input" type="file" accept=".xlsx,.xls" className="block w-full max-w-xs border border-gray-300 rounded-lg p-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white" />
          <Button
            color="primary"
            variant="light"
            className="text-blue-600 underline text-xs dark:text-blue-400"
            onClick={() => generateExcelTemplate(type)}
          >
            Descargar plantilla de ejemplo
          </Button>
        </div>
      </ModalBody>
      <ModalFooter className="dark:border-t dark:border-gray-700">
        <Button color="danger" variant="light" onPress={onClose}>Cancelar</Button>
        <Button color="success" onPress={onImport}>Importar</Button>
      </ModalFooter>
    </ModalContent>
  </Modal>
);

// --- 3. COMPONENTE PRINCIPAL ---
function Productos() {
  const { hasCreatePermission } = usePermisos();
  const location = useLocation();
  const navigate = useNavigate();

  // Hooks de datos y UI
  const { data, isLoading, ops, reloadData } = useInventoryData();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null = no editando
  const [searchTerm, setSearchTerm] = useState('');

  // Estado Importación
  const [importModal, setImportModal] = useState({ open: false, type: null });

  // -- Lógica de Pestañas --
  const activeTab = useMemo(() => {
    const path = location.pathname;
    if (path.endsWith('/marcas')) return 'marcas';
    if (path.endsWith('/categorias')) return 'categorias';
    if (path.endsWith('/subcategorias')) return 'subcategorias';
    return 'productos';
  }, [location.pathname]);

  const handleTabChange = (key) => {
    if (key === activeTab) return;
    const routes = {
      productos: '/productos',
      marcas: '/productos/marcas',
      categorias: '/productos/categorias',
      subcategorias: '/productos/subcategorias'
    };
    navigate(routes[key] || '/productos');
  };

  // -- Lógica de Edición --
  const handleEditOpen = (producto) => setEditingProduct(producto);
  const handleEditClose = () => setEditingProduct(null);

  // -- Lógica de Exportación --
  const handleExport = async (type) => {
    const dataToExport = data[type];
    if (!dataToExport || dataToExport.length === 0) {
      toast.error(`No hay datos de ${type} para exportar.`);
      return;
    }
    try {
      await generateExcel(type, dataToExport);
      toast.success(`Exportación de ${type} completada.`);
    } catch (error) {
      console.error("Error exportando");
      toast.error("Error al generar el archivo Excel.");
    }
  };

  // -- Lógica de Importación --
  const handleImport = async () => {
    const fileInput = document.getElementById('import-file-input');
    const file = fileInput?.files[0];

    if (!file) {
      toast.error("Por favor selecciona un archivo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          toast.error("El archivo está vacío.");
          return;
        }

        const type = importModal.type;
        let mappedData = [];

        // Helper para parsear estado
        const parseEstado = (val) => {
          if (val === 1 || val === '1' || val === true || String(val).toLowerCase() === 'activo') return 1;
          if (val === 0 || val === '0' || val === false || String(val).toLowerCase() === 'inactivo') return 0;
          return 1; // Default a activo si no se especifica o es inválido
        };

        // Mapeo de columnas (Headers del Excel -> Keys del Backend)
        if (type === 'productos') {
          mappedData = jsonData.map(row => ({
            descripcion: row['Descripción'],
            id_marca: row['Marca'],
            id_subcategoria: row['Subcategoría'],
            undm: row['Unidad Medida'],
            precio: row['Precio'],
            cod_barras: row['Código Barras'],
            estado_producto: parseEstado(row['Estado'])
          }));
        } else if (type === 'marcas') {
          mappedData = jsonData.map(row => ({
            nom_marca: row['Nombre Marca'],
            estado_marca: parseEstado(row['Estado'])
          }));
        } else if (type === 'categorias') {
          mappedData = jsonData.map(row => ({
            nom_categoria: row['Nombre Categoría'],
            estado_categoria: parseEstado(row['Estado'])
          }));
        } else if (type === 'subcategorias') {
          mappedData = jsonData.map(row => ({
            nom_subcat: row['Nombre Subcategoría'],
            id_categoria: row['Categoría'],
            estado_subcat: parseEstado(row['Estado'])
          }));
        }

        let success = false;
        if (type === 'productos') success = await importProductos(mappedData);
        else if (type === 'marcas') success = await importMarcas(mappedData);
        else if (type === 'categorias') success = await importCategorias(mappedData);
        else if (type === 'subcategorias') success = await importSubcategorias(mappedData);

        if (success) {
          setImportModal({ ...importModal, open: false });
          reloadData(); // Recargar datos para ver los cambios
        }

      } catch (error) {
        //console.error(error);
        toast.error("Error al procesar el archivo.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // -- Renderizado de Contenido Dinámico --
  const renderContent = useCallback(() => {
    switch (activeTab) {
      case 'productos':
        return (
          <>
            <div className="mb-6">
              <h1 className="font-extrabold text-4xl text-blue-900 dark:text-blue-400 tracking-tight mb-1">Gestión de productos</h1>
              <p className="text-blue-700/80 dark:text-blue-300/80 mb-4">Administra y busca productos fácilmente.</p>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <BarraSearch
                  placeholder="Buscar producto..."
                  isClearable
                  className="h-10 text-sm w-full md:w-72 dark:bg-gray-800 dark:text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClear={() => setSearchTerm('')}
                />
                <ActionButton
                  color="primary"
                  endContent={<FaPlus size={18} />}
                  onClick={() => setIsCreateModalOpen(true)}
                  isDisabled={!hasCreatePermission}
                  className={`h-10 px-4 font-semibold rounded-lg border-0 shadow-none bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-200 ${!hasCreatePermission ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  Agregar producto
                </ActionButton>
              </div>
            </div>

            <ShowProductos
              searchTerm={searchTerm}
              productos={data.productos}
              onEdit={handleEditOpen}
              onDelete={ops.productos.remove}
              updateProductoLocal={ops.productos.update}
            />

            {/* Modales de Producto */}
            {isCreateModalOpen && (
              <ProductosForm
                modalTitle="Nuevo Producto"
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={ops.productos.add}
              />
            )}
            {editingProduct && (
              <ProductosForm
                modalTitle="Editar Producto"
                initialData={editingProduct}
                onClose={handleEditClose}
                onSuccess={(updated) => {
                  ops.productos.update(updated.id_producto, updated);
                  handleEditClose();
                }}
              />
            )}
          </>
        );
      case 'marcas':
        return <Marcas marcasData={data.marcas} onAdd={ops.marcas.add} onUpdate={ops.marcas.update} onDelete={ops.marcas.remove} skipApiCall />;
      case 'categorias':
        return <Categorias categoriasData={data.categorias} onAdd={ops.categorias.add} onUpdate={ops.categorias.update} onDelete={ops.categorias.remove} skipApiCall />;
      case 'subcategorias':
        return <Subcategorias subcategoriasData={data.subcategorias} categoriasData={data.categorias} onAdd={ops.subcategorias.add} onUpdate={ops.subcategorias.update} onDelete={ops.subcategorias.remove} skipApiCall />;
      default:
        return null;
    }
  }, [activeTab, data, searchTerm, hasCreatePermission, isCreateModalOpen, editingProduct, ops]);

  return (
    <div className="m-4 p-2">
      <Toaster position="top-center" />

      {/* Header de Tabs y Herramientas */}
      {/* Header de Tabs y Herramientas */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <div className="flex-1 w-full sm:w-auto">
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={handleTabChange}
            variant="light"
            classNames={{
              tabList: "bg-slate-100 dark:bg-zinc-800 p-1 rounded-2xl gap-2",
              cursor: "bg-white dark:bg-zinc-950 shadow-sm rounded-xl",
              tab: "h-9 px-4 rounded-xl text-slate-500 font-medium data-[selected=true]:text-blue-600 dark:data-[selected=true]:text-blue-400 transition-all",
              tabContent: "font-semibold"
            }}
          >
            <Tab key="productos" title="Productos" />
            <Tab key="marcas" title="Marcas" />
            <Tab key="categorias" title="Categorías" />
            <Tab key="subcategorias" title="Subcategorías" />
          </Tabs>
        </div>

        {/* Herramientas: Importar / Exportar */}
        <div className="flex gap-3 mt-4 sm:mt-0">
          <Button
            onClick={() => setImportModal({ open: true, type: activeTab })}
            variant="flat"
            className="px-5 h-10 rounded-xl font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400"
            startContent={<FaFileExcel size={18} />}
          >
            Importar
          </Button>
          <Button
            onClick={() => handleExport(activeTab)}
            variant="flat"
            className="px-5 h-10 rounded-xl font-bold text-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400"
            startContent={<FaFileExport size={18} />}
          >
            Exportar
          </Button>
        </div>
      </div>

      {/* Área de Contenido Principal */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            <span className="text-blue-600 font-medium animate-pulse">Cargando inventario...</span>
          </div>
        ) : (
          renderContent()
        )}
      </div>

      {/* Modal de Importación Global */}
      <ImportDataModal
        isOpen={importModal.open}
        onClose={() => setImportModal({ ...importModal, open: false })}
        type={importModal.type}
        onImport={handleImport}
      />
    </div>
  );
}

export default Productos;