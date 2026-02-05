import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Toaster, toast } from "react-hot-toast";
import { FaPlus, FaFileExcel, FaFileExport } from "react-icons/fa";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Dropdown, DropdownTrigger,
  DropdownMenu, DropdownItem, Tabs, Tab
} from "@heroui/react";
import { motion } from "framer-motion";
import TableSkeleton from "@/components/Skeletons/TableSkeleton";
import * as XLSX from 'xlsx';

// Rutas y Servicios
import { usePermisos } from '@/routes';
import { useQueryState, parseAsString } from 'nuqs';
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
import ViewVariantsModal from './Modals/ViewVariantsModal';
import Marcas from '../Marcas/Marcas';
import Categorias from '../Categorias/Categorias';
import Subcategorias from '../Subcategorias/Subcategorias';

// --- 1. CUSTOM HOOK: Manejo de Datos ---
const useInventoryData = () => {
  const [data, setData] = useState({
    productos: [],
    marcas: [],
    categorias: [],
    subcategorias: [],
    tonalidades: [],
    tallas: []
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
      tonalidades: createOperations('tonalidades', 'id_tonalidad'),
      tallas: createOperations('tallas', 'id_talla'),
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
  const { hasCreatePermission, hasGeneratePermission } = usePermisos();
  const location = useLocation();
  const navigate = useNavigate();

  // Hooks de datos y UI
  const { data, isLoading, ops, reloadData } = useInventoryData();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null = no editando

  // Refactor: Use nuqs for search term (URL state)
  const [searchTerm, setSearchTerm] = useQueryState('q', parseAsString.withDefault(''));

  // Estado Importación
  const [importModal, setImportModal] = useState({ open: false, type: null });

  // -- Lógica de Pestañas --
  const activeTab = useMemo(() => {
    const path = location.pathname;
    if (path.endsWith('/marcas')) return 'marcas';
    if (path.endsWith('/categorias')) return 'categorias';
    if (path.endsWith('/subcategorias')) return 'subcategorias';
    if (path.endsWith('/tonalidades')) return 'tonalidades';
    if (path.endsWith('/tallas')) return 'tallas';
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

  // -- Lógica de Edición y Visualización --
  const handleEditOpen = (producto) => setEditingProduct(producto);
  const handleEditClose = () => setEditingProduct(null);

  const [viewProduct, setViewProduct] = useState(null);
  const handleViewOpen = (producto) => setViewProduct(producto);
  const handleViewClose = () => setViewProduct(null);

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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <BarraSearch
                placeholder="Buscar producto..."
                isClearable
                className="h-10 text-sm w-full md:w-72 dark:bg-gray-800 dark:text-white"
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

            <ShowProductos
              searchTerm={searchTerm}
              productos={data.productos}
              onEdit={handleEditOpen}
              onView={handleViewOpen}
              onDelete={ops.productos.remove}
              updateProductoLocal={ops.productos.update}
            />

            {/* Modales de Producto */}
            {viewProduct && (
              <ViewVariantsModal
                isOpen={!!viewProduct}
                onClose={handleViewClose}
                productId={viewProduct.id_producto}
                productName={viewProduct.descripcion}
              />
            )}
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen bg-[#F3F4F6] dark:bg-[#09090b] p-6 md:p-8 font-inter"
    >

      <div className="max-w-[1920px] mx-auto space-y-6">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#1e293b] dark:text-white tracking-tight">
              Gestión de Productos
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">
              Administra el catálogo completo, marcas, categorías y subcategorías.
            </p>
          </div>
          {hasGeneratePermission && (
            <div className="flex gap-3">
              <ActionButton
                color="green"
                icon={<FaFileExcel size={18} />}
                onClick={() => setImportModal({ open: true, type: activeTab })}
              >
                Importar
              </ActionButton>
              <ActionButton
                color="indigo"
                icon={<FaFileExport size={18} />}
                onClick={() => handleExport(activeTab)}
              >
                Exportar
              </ActionButton>
            </div>
          )}
        </div>

        {/* Tabs Section */}
        <div className="w-full overflow-x-auto pb-2">
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={handleTabChange}
            variant="light"
            classNames={{
              tabList: "bg-white dark:bg-zinc-900/50 p-1.5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm gap-2",
              cursor: "w-full bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20",
              tab: "h-9 px-4 text-slate-500 dark:text-slate-400 data-[selected=true]:text-white font-semibold text-sm transition-all",
              tabContent: "group-data-[selected=true]:text-white"
            }}
          >
            <Tab key="productos" title="Productos" />
            <Tab key="marcas" title="Marcas" />
            <Tab key="categorias" title="Categorías" />
            <Tab key="subcategorias" title="Subcategorías" />
          </Tabs>
        </div>

        {/* Content Area */}
        <div className="min-h-[400px]">
          {isLoading ? (
            <TableSkeleton rows={10} />
          ) : (
            renderContent()
          )}
        </div>
      </div>

      {/* Modal de Importación Global */}
      <ImportDataModal
        isOpen={importModal.open}
        onClose={() => setImportModal({ ...importModal, open: false })}
        type={importModal.type}
        onImport={handleImport}
      />
    </motion.div>
  );
}

export default Productos;