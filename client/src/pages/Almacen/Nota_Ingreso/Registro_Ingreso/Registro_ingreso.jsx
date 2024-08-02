import React, { useState, useEffect } from 'react';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import ModalBuscarProducto from '../ComponentsNotaIngreso/Modals/BuscarProductoForm';
import ProductosModal from '@/pages/Productos/ProductosForm';
import { Link } from 'react-router-dom';
import { FiSave } from "react-icons/fi";
import { FaBarcode } from "react-icons/fa6";
import { MdPersonAdd } from "react-icons/md";
import { MdCancelPresentation } from "react-icons/md";
import useRegistroNotaIngresoData from './data/Registro_ingreso_data';
import RegistroTablaIngreso from './ComponentsRegistroNotaIngreso/RegistroNotaIngresoTable';
import AgregarProovedor from '../../Nota_Salida/ComponentsNotaSalida/Modals/AgregarProovedor';
import useProductosData from './data/data_buscar_producto';

function Registro_Ingresos() {
  const { ingresos, addIngreso, removeIngreso } = useRegistroNotaIngresoData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenProducto, setIsModalOpenProducto] = useState(false);
  const [isModalOpenProovedor, setIsModalOpenProovedor] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [productos, setProductos] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [productosSeleccionados, setProductosSeleccionados] = useState(() => {
    const saved = localStorage.getItem('productosSeleccionados');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('productosSeleccionados', JSON.stringify(productosSeleccionados));
  }, [productosSeleccionados]);

  const openModalBuscarProducto = () => setIsModalOpen(true);
  const closeModalBuscarProducto = () => setIsModalOpen(false);

  const openModalProducto = (title) => {
    setModalTitle(title);
    setIsModalOpenProducto(true);
  };

  const closeModalProducto = () => {
    setIsModalOpenProducto(false);
  };

  const openModalProovedor = () => {
    setIsModalOpenProovedor(true);
  };

  const closeModalProovedor = () => {
    setIsModalOpenProovedor(false);
  };

  const handleBuscarProducto = async () => {
    const almacenId = localStorage.getItem('almacen');
    const filters = {
      descripcion: searchInput,
      almacen: almacenId || 1,
    };

    const result = await useProductosData(filters);
    setProductos(result.productos);
  };

  const handleCancel = () => {
    localStorage.removeItem('productosSeleccionados');
    setProductosSeleccionados([]);
  };

  const agregarProducto = (producto, cantidad) => {
    setProductosSeleccionados((prevProductos) => {
      const productoExistente = prevProductos.find(p => p.codigo === producto.codigo);
      if (productoExistente) {
        return prevProductos.map(p =>
          p.codigo === producto.codigo ? { ...p, cantidad: p.cantidad + cantidad } : p
        );
      } else {
        return [...prevProductos, { ...producto, cantidad }];
      }
    });
    closeModalBuscarProducto();
  };

  return (
    <div>
      <Breadcrumb paths={[
        { name: 'Inicio', href: '/inicio' },
        { name: 'Almacén', href: '/almacen' },
        { name: 'Nota de ingreso', href: '/almacen/nota_ingreso' },
        { name: 'Nueva nota de ingreso', href: '/almacen/nota_ingreso/registro_ingreso' }
      ]} />
      <hr className="mb-4" />
      <div className="flex justify-between mt-5 mb-4">
        <h1 className="text-xl font-bold" style={{ fontSize: '36px' }}>
          Nota de ingreso
        </h1>
      </div>
      <div className="container-registro-detalle-venta" style={{ backgroundColor: 'lightgray', padding: 20 }}>
        <form className="flex rounded-lg">
          <div className="flex flex-col w-1/2">
            <div className="grid grid-cols-2 gap-4">
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="destinatario">
                  Destinatario:
                </label>
                <input className='border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 pl-10 p-2.5' id="destinatario" type="text" />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="ruc">
                  RUC:
                </label>
                <input className='border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 pl-10 p-2.5' id="ruc" type="text" />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="numero">
                  Número:
                </label>
                <input className='border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 pl-10 p-2.5' id="numero" type="text" />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fechaDocu">
                  Fecha Docu:
                </label>
                <input type="date" className="border border-gray-300 rounded-lg p-2.5" id="fechaDocu" />
              </div>
            </div>
            <div className="flex justify-start mt-4 space-x-2">
              <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button" onClick={openModalProovedor}>
                <MdPersonAdd className="inline-block mr-2 text-lg" /> Nuevo proveedor
              </button>

              <button 
                className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" 
                type="button" 
                onClick={openModalBuscarProducto}
              >
                <FaBarcode className="inline-block mr-2" /> Buscar producto
              </button>
              <Link to="/almacen/nota_ingreso">
                <button 
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" 
                  type="button" 
                  onClick={handleCancel} // Agrega el evento onClick
                >
                  <MdCancelPresentation className="inline-block mr-2"  /> Cancelar
                </button>
              </Link>
              <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button">
                <FiSave className="inline-block mr-2 text-lg" /> Guardar
              </button>
            </div>
          </div>
          <div className="ml-4 flex flex-col w-1/2">
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="glosa">
                Glosa:
              </label>
              <input className="border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 pl-24 p-2.5 w-full" id="glosa" type="text" />
            </div>
            <div className="flex-1">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="observacion">
                Observación:
              </label>
              <textarea className="border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 pl-24 p-2.5 w-full h-full" id="observacion"></textarea>
            </div>
          </div>
        </form>
        <div>
          <br />
          <br />
          <RegistroTablaIngreso ingresos={productosSeleccionados} setProductosSeleccionados={setProductosSeleccionados} />
        </div>
      </div>
      <ModalBuscarProducto 
        isOpen={isModalOpen} 
        onClose={closeModalBuscarProducto} 
        onBuscar={handleBuscarProducto} 
        setSearchInput={setSearchInput}
        productos={productos}
        agregarProducto={agregarProducto}
      />
      {isModalOpenProducto && (
        <ProductosModal modalTitle={modalTitle} onClose={closeModalProducto} />
      )}
      <AgregarProovedor isOpen={isModalOpenProovedor} onClose={closeModalProovedor} />

    </div>
  );
}

export default Registro_Ingresos;
