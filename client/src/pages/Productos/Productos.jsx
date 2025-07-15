import { useState, useEffect } from 'react';
import ProductosForm from './ProductosForm';
import { Toaster } from "react-hot-toast";
import { ShowProductos } from './ShowProductos';
import { FaPlus } from "react-icons/fa";
import { Button } from "@heroui/button";
import { usePermisos } from '@/routes';
import BarraSearch from "@/components/Search/Search";
import { getProductos } from '@/services/productos.services';

function Productos() {
  const { hasCreatePermission } = usePermisos();

  // Estado de productos
  const [productos, setProductos] = useState([]);
  const [activeAdd, setModalOpen] = useState(false);

  // Estado de edición
  const [activeEdit, setActiveEdit] = useState(false);
  const [editData, setEditData] = useState(null);

  // Input de búsqueda de productos
  const [searchTerm, setSearchTerm] = useState('');
  const handleSearchChange = (e) => setSearchTerm(e.target.value);

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

  return (
    <div className="min-h-screen py-8 px-2 sm:px-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header y acciones */}
        <div className="bg-white/80 border border-blue-100 rounded-2xl shadow-sm p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h1 className="font-extrabold text-4xl text-blue-900 tracking-tight mb-1">Gestión de productos</h1>
            <p className="text-base text-blue-700/80">Administra y busca productos fácilmente.</p>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-3 w-full md:w-auto">
            <BarraSearch
              placeholder="Ingrese un producto"
              isClearable={true}
              className="h-10 text-sm w-full md:w-72"              
              value={searchTerm}
              onChange={handleSearchChange}
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
        </div>

        {/* Lista de productos */}
        <div className="bg-white/90 border border-blue-100 rounded-xl shadow-sm p-4">
          <ShowProductos
            searchTerm={searchTerm}
            productos={productos}
            onEdit={handleEdit}
            onDelete={removeProducto}
            updateProductoLocal={updateProductoLocal}
          />
        </div>
      </div>

      {/* Modal de Agregar Producto */}
      {activeAdd && (
        <ProductosForm
          modalTitle={'Nuevo Producto'}
          onClose={() => setModalOpen(false)}
          onSuccess={addProductoLocal}
        />
      )}

      {/* Modal de Editar Producto */}
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
      <Toaster />
    </div>
  );
}

export default Productos;