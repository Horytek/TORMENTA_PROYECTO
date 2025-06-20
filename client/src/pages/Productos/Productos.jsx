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
    <div>
      <Toaster />
      <h1 className='font-extrabold text-4xl'>Gestión de productos</h1>
      <div className="flex justify-between mt-5 mb-4 items-center">
        <div id="barcode-scanner" hidden style={{ width: '100%', height: '400px' }}></div>
        <h6 className="font-bold">Lista de Productos</h6>
        <BarraSearch
          placeholder="Ingrese un producto"
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
            className={`${!hasCreatePermission ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Agregar producto
          </Button>
        </div>
      </div>
      <div>
        <ShowProductos
          searchTerm={searchTerm}
          productos={productos}
          onEdit={handleEdit}
          onDelete={removeProducto}
          updateProductoLocal={updateProductoLocal}
        />
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
    </div>
  );
}

export default Productos;