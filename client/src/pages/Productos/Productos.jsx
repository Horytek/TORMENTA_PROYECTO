import { useState } from 'react';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import ProductosForm from './ProductosForm';
import { Toaster } from "react-hot-toast";
import { ShowProductos } from './ShowProductos';
import { FaPlus } from "react-icons/fa";
import { Button } from "@heroui/button";
import { usePermisos } from '@/routes';
import BarraSearch from "@/components/Search/Search";

function Productos() {
  const { hasCreatePermission } = usePermisos();

  // Estado de Modal de Agregar Producto
  const [activeAdd, setModalOpen] = useState(false);
  const handleModalAdd = () => {
    setModalOpen(!activeAdd);
  };

  // Input de búsqueda de productos
  const [searchTerm, setSearchTerm] = useState('');
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div>
      <Toaster />
      <Breadcrumb paths={[{ name: 'Inicio', href: '/inicio' }, { name: 'Productos', href: '/productos' }]} />
      <hr className="mb-4" />
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
            onClick={handleModalAdd}
            disabled={!hasCreatePermission}
            className={`${!hasCreatePermission ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Agregar producto
          </Button>
        </div>
      </div>
      <div>
        <ShowProductos searchTerm={searchTerm} />
      </div>

      {/* Modal de Agregar Producto */}
      {activeAdd && (
        <ProductosForm modalTitle={'Nuevo Producto'} onClose={handleModalAdd} />
      )}

    </div>
  );
}

export default Productos;