import { useState, useRef } from 'react';// Importa QuaggaJS
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import TablaDetallesVenta from './ComponentsRegistroVentas/RegistroVentaTable';
import ModalProducto from './ComponentsRegistroVentas/Modals/ProductoModal';
import useVentasData from '../Data/data_venta';
import useProductosData from '../Data/data_producto_venta';
import { BsCashCoin } from "react-icons/bs";
import { GrDocumentPerformance } from "react-icons/gr";
import AlertModal from '../../../components/Modals/AlertModal';
import CobrarModal from './ComponentsRegistroVentas/Modals/PagarModal';
import './Registro_Venta.css';
import useClientesData from '../Data/data_cliente_venta';
import { useReactToPrint } from 'react-to-print';
import Comprobante from '../Registro_Venta/ComponentsRegistroVentas/Comprobantes/CotizacionPDF/CotizacionPDF';  // Asegúrate de ajustar la ruta según sea necesario
import PropTypes from 'prop-types';
import {Toaster} from "react-hot-toast";
import {toast} from "react-hot-toast";
//import {Button} from "@nextui-org/react";

const Registro_Venta = () => {
  const { detalles, addDetalle, updateDetalle, removeDetalle } = useVentasData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCobrarModalOpen, setIsCobrarModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTerm2, setSearchTerm2] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const { productos, setProductos } = useProductosData();
  const [detalleMode, setDetalleMode] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const componentRef = useRef();
  //const [barcode, setBarcode] = useState('');

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  const handleProductSelect = (producto) => {
    const existingDetalle = detalles.find(detalle => detalle.codigo === producto.codigo);

    const productoIndex = productos.findIndex(p => p.codigo === producto.codigo);
    if (productoIndex !== -1 && productos[productoIndex].stock > 0) {
      if (existingDetalle) {
        const updatedCantidad = existingDetalle.cantidad + 1;
        const updatedSubtotal = (parseFloat(existingDetalle.precio) * updatedCantidad - ((parseFloat(existingDetalle.descuento) / 100) * existingDetalle.precio) * updatedCantidad).toFixed(2);
        updateDetalle({ ...existingDetalle, cantidad: updatedCantidad, subtotal: `S/ ${updatedSubtotal}` });
      } else {
        const subtotal = (parseFloat(producto.precio) - parseFloat(0)).toFixed(2);
        const newDetalle = { ...producto, cantidad: 1, descuento: '0', subtotal: `S/ ${subtotal}` };
        addDetalle(newDetalle);
      }

      setProductos(prevProductos => prevProductos.map(p => p.codigo === producto.codigo ? { ...p, stock: p.stock - 1 } : p));
    } else {
      setShowAlert(true);
    }

    setIsModalOpen(false);
  };

  const handleProductRemove = (codigo, cantidad) => {
    removeDetalle(codigo);
    setProductos(prevProductos => prevProductos.map(p => p.codigo === codigo ? { ...p, stock: p.stock + cantidad } : p));
  };

  const totalImporte = detalles.reduce((acc, item) => {
    // Asumiendo que item.subtotal está en formato "S/ 70.00"
    // Usa la función replace para quitar el símbolo de moneda y convertir a número
    const subtotalNumber = parseFloat(item.subtotal.replace('S/ ', '').replace(',', '.'));
    return (acc + subtotalNumber)/1.18;
}, 0).toFixed(2);

  const igv_t = (totalImporte * 0.18).toFixed(2);
  const total_t = parseFloat((parseFloat(totalImporte) + parseFloat(igv_t)).toFixed(2));

  const datos_precio = {
    igv_t: igv_t,
    total_t: total_t,
  }

  const saveDetallesToLocalStorage_1 = () => {
    localStorage.setItem('datos_precio', JSON.stringify(datos_precio));
  };

  saveDetallesToLocalStorage_1();

  const filteredProductos = productos.filter(producto =>
    producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedCategory ? producto.categoria === selectedCategory : true)
  );

  const toggleDetalleMode = () => {
    setDetalleMode(prevMode => !prevMode);
    setSearchTerm('');
  };

  const handleQuantityChange = (index, newCantidad) => {
    if (newCantidad >= 0) {
      const updatedDetalles = [...detalles];
      const detalleToUpdate = { ...updatedDetalles[index] };
      const oldCantidad = detalleToUpdate.cantidad;

      const productoCodigo = detalleToUpdate.codigo;
      const productoIndex = productos.findIndex(p => p.codigo === productoCodigo);

      if (productoIndex !== -1) {
        const producto = productos[productoIndex];

        if (newCantidad <= producto.stock + oldCantidad) {
          detalleToUpdate.cantidad = newCantidad;

          const subtotal = (parseFloat(detalleToUpdate.precio) * newCantidad - ((parseFloat(detalleToUpdate.descuento) / 100) * detalleToUpdate.precio) * newCantidad).toFixed(2);

          detalleToUpdate.subtotal = `S/ ${subtotal}`;

          updateDetalle(detalleToUpdate);

          const updatedProductos = [...productos];
          updatedProductos[productoIndex].stock += oldCantidad - newCantidad;
          setProductos(updatedProductos);
        } else {
          setShowAlert(true);
        }
      }
    }
  };

  const handleDiscountChange = (index, detalle) => {
    const updatedDetalles = [...detalles];
    updatedDetalles[index] = detalle;
    updateDetalle(updatedDetalles);
  };

  const handlePrecieChange = (index, detalle) => {
    const updatedDetalles = [...detalles];
    updatedDetalles[index] = detalle;
    updateDetalle(updatedDetalles);
  }

  const saveDetallesToLocalStorage = () => {
    localStorage.setItem('detalles', JSON.stringify(detalles));
  };

  saveDetallesToLocalStorage();

  const { clientes } = useClientesData();
  const cliente = clientes.find(cliente => cliente.id === 1);


  const datosVentaComprobante = {

    fecha: new Date().toISOString().slice(0, 10),
    nombre_cliente: cliente ? cliente.nombre : '',
    documento_cliente: cliente ? cliente.documento : '',
    direccion_cliente: cliente ? cliente.direccion : '',
  // Calcular el total importe sin IGV
  totalImporte_venta: detalles.reduce((acc, detalle) => {
    const precioSinIGV = parseFloat(detalle.precio) / 1.18; // Dividir el precio por 1.18 para obtener el valor sin IGV
    return acc + (precioSinIGV * detalle.cantidad);
  }, 0).toFixed(2),

  // Calcular el IGV basado en el total importe sin IGV
  igv: detalles.reduce((acc, detalle) => {
    const precioSinIGV = parseFloat(detalle.precio) / 1.18;
    const igvDetalle = precioSinIGV * 0.18 * detalle.cantidad; // Calcular el IGV del detalle
    return acc + igvDetalle;
  }, 0).toFixed(2),

  // Calcular el total sumando el total importe sin IGV y el IGV
  total_t: detalles.reduce((acc, detalle) => {
    const precioSinIGV = parseFloat(detalle.precio) / 1.18;
    const igvDetalle = precioSinIGV * 0.18 * detalle.cantidad;
    return acc + (precioSinIGV + igvDetalle) * detalle.cantidad;
  }, 0).toFixed(2),
  
    descuento_venta: parseFloat(detalles.reduce((acc, detalle) => acc + (parseFloat(detalle.precio) * parseFloat(detalle.descuento) / 100) * detalle.cantidad, 0).toFixed(2)),
    detalles: detalles.map(detalle => {
      const producto = productos.find(producto => producto.codigo === detalle.codigo);
      return {
        id_producto: detalle.codigo,
        nombre: detalle.nombre,
        undm: producto ? producto.undm : '',
        nom_marca: producto ? producto.nom_marca : '',
        cantidad: detalle.cantidad,
        precio: parseFloat(detalle.precio),
        descuento: parseFloat(detalle.descuento),
        sub_total: parseFloat(detalle.subtotal.replace(/[^0-9.-]+/g, '')),
      };
    }).filter(detalle => detalle !== null),
  };


  const Comprobar_mayor_499 = () => {
    if (total_t > 499) {
      toast.error('La venta no puede tener un monto mayor a 499 soles');
    } else {
      if (total_t <= 0) {
        toast.error('No hay productos en la venta');
      } else {
        setIsCobrarModalOpen(true);
      }
    }
  };

  return (
    <>
      <Toaster />

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
            <input type="text" className={` mr-2 form-input py-2 px-4 w-full text-gray-700 placeholder-gray-400 rounded border-none focus:outline-none ${!detalleMode ? 'cursor-not-allowed bg-gray-200' : ''}`}
              placeholder="Buscar producto en el detalle" style={{ boxShadow: '0 0 10px #171a1f33' }} value={searchTerm2} onChange={(e) => setSearchTerm2(e.target.value)} disabled={!detalleMode} />
            <button className="btn ml-2 btn-producto px-6 py-2" onClick={() => setIsModalOpen(true)}>Producto</button>
          </div>
          <TablaDetallesVenta detalles={detalles} handleProductRemove={handleProductRemove} handleQuantityChange={handleQuantityChange} handleDiscountChange={handleDiscountChange} handlePrecieChange={handlePrecieChange} />

          <div className="flex justify-end mt-4">
            <div className="flex flex-col w-100">
              <div className="flex justify-between my-1 items-center">
                <span className='font-bold flex justify-end span-title mr-3'>IMPORTE:</span>
                <span className='inputs-montos'>S/ {totalImporte}</span>
              </div>
              <div className="flex justify-between my-1 items-center">
                <span className='font-bold flex justify-end span-title'>IGV:</span>
                <span className='inputs-montos'>S/ {igv_t}</span>
              </div>
              <div className="flex justify-between my-1 items-center">
                <span className='font-bold flex justify-end span-title'>TOTAL:</span>
                <span className='inputs-montos'>S/ {total_t}</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <div className='items-center flex ml-2'>
              <button className="btn btn-cotizar  flex items-center" onClick={() => handlePrint(true)} disabled={detalles.length === 0}>
                <GrDocumentPerformance style={{ fontSize: '22px' }} />
                Cotizar</button>
            </div>
            <div style={{ display: 'none' }}>
              <Comprobante ref={componentRef} datosVentaComprobante={datosVentaComprobante} />
            </div>
            <div className='items-center flex ml-2'>
              <button className="btn btn-cobrar mr-0 flex items-center" onClick={Comprobar_mayor_499}>
                <BsCashCoin style={{ fontSize: '22px' }} />
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
        searchTerm2={searchTerm2}
      />
      <CobrarModal isOpen={isCobrarModalOpen} onClose={() => setIsCobrarModalOpen(false)} totalImporte={` ${total_t}`} total_I={` ${totalImporte}`} />
    </>
  );
};

Registro_Venta.propTypes = {
  clienteSeleccionado: PropTypes.string.isRequired,
};

Registro_Venta.defaultProps = {
  clienteSeleccionado: '', // Valor por defecto si no se pasa ninguna prop
};


export default Registro_Venta;
