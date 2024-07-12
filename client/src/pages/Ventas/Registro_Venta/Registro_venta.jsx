import { useState } from 'react';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import TablaDetallesVenta from './ComponentsRegistroVentas/RegistroVentaTable';
import ModalProducto from './ComponentsRegistroVentas/Modals/ProductoModal';
import useVentasData from '../Data/Venta_Data';
import { BsCashCoin } from "react-icons/bs";
import AlertModal from '../../../components/AlertModal/AlertModal';

import './Registro_Venta.css';

const Registro_Venta = () => {
  const { detalles, addDetalle, updateDetalle, removeDetalle } = useVentasData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTerm2, setSearchTerm2] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [productos, setProductos] = useState([
    { codigo: '001', nombre: 'Vestido Jean Talla 28', precio: '55.08', stock: 25, categoria: 'vestido' },
    { codigo: '002', nombre: 'Vestido Jean Talla 25', precio: '55.08', stock: 20, categoria: 'vestido' },
    { codigo: '003', nombre: 'Vestido Jean Talla 30', precio: '55.08', stock: 30, categoria: 'vestido' },
    { codigo: '004', nombre: 'Short Jean Talla M', precio: '40.00', stock: 50, categoria: 'short' },
    { codigo: '005', nombre: 'Bolso Cuero Negro', precio: '75.00', stock: 15, categoria: 'bolso' },
  ]);
  const [detalleMode, setDetalleMode] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  const handleProductSelect = (producto) => {
    const existingDetalle = detalles.find(detalle => detalle.codigo === producto.codigo);

    // Verificar si hay suficiente stock disponible
    const productoIndex = productos.findIndex(p => p.codigo === producto.codigo);
    if (productoIndex !== -1 && productos[productoIndex].stock > 0) {
      if (existingDetalle) {
        const updatedCantidad = existingDetalle.cantidad + 1;
        const updatedIgv = (parseFloat(producto.precio) * 0.18 * updatedCantidad).toFixed(2);
        const updatedSubtotal = (parseFloat(producto.precio) * updatedCantidad + parseFloat(updatedIgv) - parseFloat(existingDetalle.descuento)).toFixed(2);
        updateDetalle({ ...existingDetalle, cantidad: updatedCantidad, igv: `S/ ${updatedIgv}`, subtotal: `S/ ${updatedSubtotal}` });
      } else {
        const igvValue = (parseFloat(producto.precio) * 0.18).toFixed(2);
        const subtotal = (parseFloat(producto.precio) + parseFloat(igvValue) - parseFloat(0)).toFixed(2);
        const newDetalle = { ...producto, cantidad: 1, descuento: '0', igv: `S/ ${igvValue}`, subtotal: `S/ ${subtotal}` };
        addDetalle(newDetalle);
      }

      setProductos(prevProductos => prevProductos.map(p => p.codigo === producto.codigo ? { ...p, stock: p.stock - 1 } : p));
    } else {
      // No hay suficiente stock disponible
      setShowAlert(true);
      // Puedes mostrar un mensaje de error o manejarlo según tu flujo de la aplicación
    }

    setIsModalOpen(false);
  };

  const handleProductRemove = (codigo, cantidad) => {
    removeDetalle(codigo);
    setProductos(prevProductos => prevProductos.map(p => p.codigo === codigo ? { ...p, stock: p.stock + cantidad } : p));
  };

  const totalImporte = detalles.reduce((acc, item) => acc + parseFloat(item.subtotal.slice(2)), 0).toFixed(2);

  const filteredProductos = productos.filter(producto =>
    producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedCategory ? producto.categoria === selectedCategory : true)
  );

  const toggleDetalleMode = () => {
    setDetalleMode(prevMode => !prevMode);
    setSearchTerm(''); // Resetear término de búsqueda al cambiar modo
  };

  const handleQuantityChange = (index, newCantidad) => {
    if (newCantidad >= 0) {
      const updatedDetalles = [...detalles];
      const detalleToUpdate = { ...updatedDetalles[index] };
      const oldCantidad = detalleToUpdate.cantidad;
  
      // Verificar si hay suficiente stock disponible
      const productoCodigo = detalleToUpdate.codigo;
      const productoIndex = productos.findIndex(p => p.codigo === productoCodigo);
      if (productoIndex !== -1) {
        const producto = productos[productoIndex];
        if (newCantidad <= producto.stock + oldCantidad) {
          // Actualizar detalle con nueva cantidad
          detalleToUpdate.cantidad = newCantidad;
  
          // Calcular y actualizar IG(V) y subtotal
          const igvValue = (parseFloat(producto.precio) * 0.18 * newCantidad).toFixed(2);
          const subtotal = (parseFloat(producto.precio) * newCantidad + parseFloat(igvValue) - parseFloat(detalleToUpdate.descuento)).toFixed(2);
          detalleToUpdate.igv = `S/ ${igvValue}`;
          detalleToUpdate.subtotal = `S/ ${subtotal}`;
  
          // Actualizar detalle de venta
          updateDetalle(detalleToUpdate);
  
          // Actualizar stock del producto
          const updatedProductos = [...productos];
          updatedProductos[productoIndex].stock += oldCantidad - newCantidad;
          setProductos(updatedProductos);
        } else {
          setShowAlert(true);

        }
      }
    }
  };
  
  return (
    <>
      <Breadcrumb paths={[{ name: 'Inicio', href: '/inicio' }, { name: 'Ventas', href: '/ventas' }, { name: 'Registrar', href: '/ventas/registro_venta' }]} />
      <hr className="mb-4" />
      <div className="flex justify-between mt-5 mb-4">
        <h1 className="text-xl font-bold mb-5" style={{ fontSize: '36px' }}> Registrar Venta </h1>
      </div>
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="container-registro-detalle-venta w-full p-4" style={{ height: "max-content" }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Detalle de venta</h2>
            <div className="flex items-center space-x-2">
              <label htmlFor="switchDetalles" className="flex items-center cursor-pointer">
                <div className={`relative w-12 h-6 transition-colors duration-200 ease-in-out rounded-full ${detalleMode ? 'bg-custom-blue' : 'bg-gray-200'}`}>
                  <input id="switchDetalles" type="checkbox" className="sr-only" checked={detalleMode} onChange={toggleDetalleMode} />
                  <div className={`block w-6 h-6 rounded-full shadow-md transform duration-200 ease-in-out ${detalleMode ? 'translate-x-6 bg-white' : 'translate-x-0 bg-gray-300'}`}></div>
                </div>
                <div className="ml-3 text-gray-700 font-medium">Búsqueda por detalle</div>
              </label>
            </div>
          </div>
          <div className="flex items-center mb-4">
            <input type="text" className={` mr-2 form-input py-2 px-4 w-full text-gray-700 placeholder-gray-400 rounded focus:outline-none ${!detalleMode ? 'cursor-not-allowed bg-gray-200' : ''}`}
              placeholder="Buscar producto en el detalle" style={{ boxShadow: '0 0 10px #171a1f33' }} value={searchTerm2} onChange={(e) => setSearchTerm2(e.target.value)} disabled={!detalleMode} />
            <button className="btn ml-2 btn-producto px-6 py-2 " onClick={() => setIsModalOpen(true)}>Producto</button>
          </div>
          <TablaDetallesVenta detalles={detalles} handleProductRemove={handleProductRemove} handleQuantityChange={handleQuantityChange} />
          <div className="flex justify-end mt-4">
            <div className="flex flex-col w-100">
              <div className="flex justify-between my-1 items-center">
                <span className='font-bold flex justify-end span-title mr-3'>IMPORTE:</span>
                <span className='inputs-montos'>S/ {totalImporte}</span>
              </div>
              <div className="flex justify-between my-1 items-center">
                <span className='font-bold flex justify-end span-title'>IGV:</span>
                <span className='inputs-montos'>S/ 0.00</span>
              </div>
              <div className="flex justify-between my-1 items-center">
                <span className='font-bold flex justify-end span-title'>TOTAL:</span>
                <span className='inputs-montos'>S/ {totalImporte}</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button className="btn btn-cerrar  ">Cerrar</button>
            <div className='items-center flex ml-2'>
              <button className="btn btn-cobrar mr-0">
                <BsCashCoin className="" style={{ fontSize: '22px' }} />
                Cobrar
              </button>
            </div>
          </div>
        </div>
        {showAlert && (
        <AlertModal
          message="Stock insuficiente"
          onClose={() => setShowAlert(false)}
        />
      )}
      </div>
      <ModalProducto
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        handleProductSelect={handleProductSelect}
        filteredProductos={filteredProductos}
      />
    </>
    
  );
};

export default Registro_Venta;
