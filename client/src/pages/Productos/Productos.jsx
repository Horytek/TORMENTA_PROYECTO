import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ProductosForm from './ProductosForm';
import { Toaster } from "react-hot-toast";
import { ShowProductos } from './ShowProductos';
import { FaPlus } from "react-icons/fa";
import { Button, Tabs, Tab } from "@heroui/react";
import { usePermisos } from '@/routes';
import BarraSearch from "@/components/Search/Search";
import { getProductos } from '@/services/productos.services';
import Marcas from '../Marcas/Marcas';
import Categorias from '../Categorias/Categorias';
import Subcategorias from '../Subcategorias/Subcategorias';

function Productos() {
  const { hasCreatePermission } = usePermisos();
  const location = useLocation();
  const navigate = useNavigate();

  // Determinar la pestaña activa basada en la ruta actual
  const getCurrentTab = useMemo(() => {
    const path = location.pathname;
    if (path.endsWith('/marcas')) return 'marcas';
    if (path.endsWith('/categorias')) return 'categorias';
    if (path.endsWith('/subcategorias')) return 'subcategorias';
    return 'productos'; // por defecto
  }, [location.pathname]);

  const [activeTab, setActiveTab] = useState(getCurrentTab);

  // Sincronizar activeTab con la URL cuando cambie la ruta
  useEffect(() => {
    const newTab = getCurrentTab;
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  }, [getCurrentTab, activeTab]);

  // Función para cambiar pestaña y navegar a la ruta correspondiente
  const handleTabChange = (newTab) => {
    // Solo navegar si la pestaña es diferente
    if (newTab === activeTab) return;
    
    setActiveTab(newTab);
    
    switch (newTab) {
      case 'productos':
        navigate('/productos');
        break;
      case 'marcas':
        navigate('/productos/marcas');
        break;
      case 'categorias':
        navigate('/productos/categorias');
        break;
      case 'subcategorias':
        navigate('/productos/subcategorias');
        break;
      default:
        navigate('/productos');
    }
  };

  // Estado de productos
  const [productos, setProductos] = useState([]);
  const [activeAdd, setModalOpen] = useState(false);

  // Estado de edición
  const [activeEdit, setActiveEdit] = useState(false);
  const [editData, setEditData] = useState(null);

  // Input de búsqueda de productos
  const [searchTerm, setSearchTerm] = useState('');
  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleClearSearch = () => setSearchTerm('');

  // Cargar productos solo una vez
  useEffect(() => {
    const fetchProductos = async () => {
      const data = await getProductos();
      setProductos(data || []);
    };
    fetchProductos();
  }, []);

  const transformProducto = (producto) => ({
    ...producto,
    estado_producto: producto.estado_producto === 1 || producto.estado_producto === "1" ? "Activo" : "Inactivo",
  });

  // Agregar producto localmente
  const addProductoLocal = (nuevoProducto) => {
    setProductos(prev => [nuevoProducto, ...prev]);
  };

  // Editar producto localmente
  const updateProductoLocal = (id, updatedData) => {
    setProductos(prev =>
      prev.map(p =>
        p.id_producto === id ? { ...p, ...transformProducto(updatedData) } : p
      )
    );
  };

  // Eliminar producto localmente
  const removeProducto = (id) => {
    setProductos(prev => prev.filter(p => p.id_producto !== id));
  };

  // Abrir modal de edición
  const handleEdit = (producto) => {
    setEditData(producto);
    setActiveEdit(true);
  };

  // Cerrar modal de edición
  const handleCloseEdit = () => {
    setEditData(null);
    setActiveEdit(false);
  };

  // Función para renderizar el contenido según la pestaña activa
  const renderTabContent = () => {
    switch (activeTab) {
      case 'productos':
        return (
          <>
            <h1 className="font-extrabold text-4xl text-blue-900 tracking-tight mb-1 mt-2">Gestión de productos</h1>
            <p className="text-base text-blue-700/80 mb-4">Administra y busca productos fácilmente.</p>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <BarraSearch
                placeholder="Ingrese un producto"
                isClearable={true}
                className="h-10 text-sm w-full md:w-72"
                value={searchTerm}
                onChange={handleSearchChange}
                onClear={handleClearSearch}
              />
              <Button
                color="primary"
                endContent={<FaPlus style={{ fontSize: '22px' }} />}
                onClick={() => setModalOpen(true)}
                disabled={!hasCreatePermission}
                className={`h-10 px-5 font-semibold rounded-lg shadow-sm bg-blue-600 hover:bg-blue-700 text-white transition ${!hasCreatePermission ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Agregar producto
              </Button>
            </div>
            <ShowProductos
              searchTerm={searchTerm}
              productos={productos}
              onEdit={handleEdit}
              onDelete={removeProducto}
              updateProductoLocal={updateProductoLocal}
            />
            {activeAdd && (
              <ProductosForm
                modalTitle={'Nuevo Producto'}
                onClose={() => setModalOpen(false)}
                onSuccess={addProductoLocal}
              />
            )}
            {activeEdit && (
              <ProductosForm
                modalTitle={'Editar Producto'}
                onClose={handleCloseEdit}
                initialData={editData}
                onSuccess={(updatedData) => {
                  updateProductoLocal(updatedData.id_producto, updatedData);
                  handleCloseEdit();
                }}
              />
            )}
          </>
        );
      case 'marcas':
        return <Marcas />;
      case 'categorias':
        return <Categorias />;
      case 'subcategorias':
        return <Subcategorias />;
      default:
        return null;
    }
  };

return (
  <div className="m-4">
    <Toaster />
    <Tabs 
      selectedKey={activeTab}
      onSelectionChange={handleTabChange}
      classNames={{
        tabList: "bg-transparent flex gap-4",
        tab: "rounded-lg px-6 py-3 font-semibold text-base transition-colors text-blue-700 data-[selected=true]:bg-gradient-to-r data-[selected=true]:from-blue-100 data-[selected=true]:to-blue-50 data-[selected=true]:text-blue-900 data-[selected=true]:shadow data-[selected=true]:border data-[selected=true]:border-blue-200",
      }}>
      <Tab key="productos" title="Productos">
        {/* El contenido se renderiza abajo */}
      </Tab>
      <Tab key="marcas" title="Marcas">
        {/* El contenido se renderiza abajo */}
      </Tab>
      <Tab key="categorias" title="Categorías">
        {/* El contenido se renderiza abajo */}
      </Tab>
      <Tab key="subcategorias" title="Subcategorías">
        {/* El contenido se renderiza abajo */}
      </Tab>
    </Tabs>
    
    {/* Contenido dinámico según la pestaña activa */}
    <div className="mt-4">
      {renderTabContent()}
    </div>
  </div>
);
}

export default Productos;