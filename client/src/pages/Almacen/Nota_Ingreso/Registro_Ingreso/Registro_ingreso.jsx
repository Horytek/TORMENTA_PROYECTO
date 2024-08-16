import React,  { useState, useEffect } from 'react';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import ModalBuscarProducto from '../ComponentsNotaIngreso/Modals/BuscarProductoForm';
import ProductosModal from '@/pages/Productos/ProductosForm';
import { Link } from 'react-router-dom';
import { FiSave } from "react-icons/fi";
import { FaBarcode } from "react-icons/fa6";
import { MdPersonAdd } from "react-icons/md";
import { MdCancelPresentation } from "react-icons/md";
import useDestinatarioData from '../data/data_destinatario_ingreso';
import useDocumentoData from '../data/data_documento_ingreso';
import useAlmacenData from '../data/data_almacen_ingreso';
import RegistroTablaIngreso from './ComponentsRegistroNotaIngreso/RegistroNotaIngresoTable';
import AgregarProovedor from '../../Nota_Salida/ComponentsNotaSalida/Modals/AgregarProovedor';
import useProductosData from './data/data_buscar_producto';
import insertNotaAndDetalle from '../data/add_nota'; // Importa la función de inserción
import './Registro_ingreso.css'; // Asegúrate de importar el mismo archivo de estilos
import { Toaster, toast } from "react-hot-toast"; // Importa el mismo paquete de validaciones
import ConfirmationModal from '../../Nota_Salida/ComponentsNotaSalida/Modals/ConfirmationModal';
const glosaOptions = [
  "COMPRA EN EL PAIS", "COMPRA EN EL EXTERIOR", "RESERVADO",
  "TRANSFERENCIA ENTRE ESTABLECIMIENTO<->CIA", "DEVOLUCION", "CLIENTE",
  "MERCAD DEVOLUCIÓN (PRUEBA)", "PROD.DESVOLUCIÓN (M.P.)", 
  "ING. PRODUCCIÓN(P.T.)", "AJUSTE INVENTARIO", "OTROS INGRESOS",
  "DESARROLLO CONSUMO INTERNO", "INGRESO DIFERIDO"
];

function Registro_Ingresos() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenProducto, setIsModalOpenProducto] = useState(false);
  const [isModalOpenProovedor, setIsModalOpenProovedor] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [productos, setProductos] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [codigoBarras, setCodigoBarras] = useState('');

  const handleBarcodeInput = (e) => {
    setCodigoBarras(e.target.value);
  };
  const [isModalOpenGuardar, setisModalOpenGuardar] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState(''); // Nuevo estado para el mensaje de confirmación
  const [productosSeleccionados, setProductosSeleccionados] = useState(() => {
    const saved = localStorage.getItem('productosSeleccionados');
    return saved ? JSON.parse(saved) : [];
  });

  const { almacenes } = useAlmacenData();
  const { destinatarios } = useDestinatarioData();
  const { documentos } = useDocumentoData();


  // Agregar la lógica de almacenOrigen
  const [almacenOrigen, setAlmacenOrigen] = useState(() => {
    const savedAlmacen = localStorage.getItem('almacen');
    return savedAlmacen ? parseInt(savedAlmacen) : '';
  });

  useEffect(() => {
    localStorage.setItem('productosSeleccionados', JSON.stringify(productosSeleccionados));
  }, [productosSeleccionados]);

  // Guardar almacenOrigen en localStorage
  useEffect(() => {
    if (almacenOrigen !== '') {
      localStorage.setItem('almacen', almacenOrigen.toString());
    }
  }, [almacenOrigen]);

  useEffect(() => {
    if (isModalOpen && almacenOrigen) {
      handleBuscarProducto();
    }
  }, [isModalOpen, almacenOrigen]);

  const openModalBuscarProducto = () => {
    if (almacenOrigen) {
      setIsModalOpen(true);
      handleBuscarProducto();
    } else {
      toast.error('Por favor seleccione un almacén de origen primero.');
    }
  };
  const closeModalBuscarProducto = () => setIsModalOpen(false);

  const openModalOpenGuardar = () => {
    const almacenDestino = document.getElementById('almacen_destino').value;
    if (almacenDestino) {
      setConfirmationMessage('¿Desea guardar esta nueva nota de ingreso?');
    } else {
      setConfirmationMessage('No hay un almacén de destino, ¿Desea guardar de todas formas?');
    }
    setisModalOpenGuardar(true);
  };

  const closeModalOpenGuardar = () => {
    setisModalOpenGuardar(false);
  };
  
  const closeModalProducto = () => setIsModalOpenProducto(false);

  const handleConfirmGuardar = async () => {
    closeModalOpenGuardar();
    await handleGuardarAction(); // Llamar a la función de guardado
  };


  const handleGuardarAction = async () => {
    const almacenO = document.getElementById('almacen_origen').value;
    const almacenD = document.getElementById('almacen_destino').value || null;
    const destinatario = document.getElementById('destinatario').value;
    const glosa = document.getElementById('glosa').value;
    const fecha = document.getElementById('fechaDocu').value;
    const nota = document.getElementById('nomnota').value;
    const numComprobante = document.getElementById('numero').value;
    const observacion = document.getElementById('observacion').value;
    const usuario = localStorage.getItem('usuario');
    if (!usuario) {
      toast.error('Usuario no encontrado. Por favor, inicie sesión nuevamente.');
      return;
    }

    const productos = productosSeleccionados.map(producto => ({
      id: producto.codigo,
      cantidad: producto.cantidad
    }));

    const data = {
      almacenO,
      almacenD,
      destinatario,
      glosa,
      nota,
      fecha,
      producto: productos.map(p => p.id),
      numComprobante,
      cantidad: productos.map(p => p.cantidad),
      observacion,
      usuario
    };

    const result = await insertNotaAndDetalle(data);

    if (result.success) {
      toast.success('Nota y detalle insertados correctamente.');
      handleCancel();
      window.location.reload();
    } else {
      toast.error('Error inesperado, intente nuevamente.');
    }
  };
  const openModalProovedor = () => setIsModalOpenProovedor(true);
  const closeModalProovedor = () => setIsModalOpenProovedor(false);

  const handleBuscarProducto = async () => {
    const almacenId = almacenOrigen || 1;
    const filters = {
      descripcion: searchInput,
      almacen: almacenId,
      cod_barras: codigoBarras
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
      const cantidadExistente = prevProductos
        .filter(p => p.codigo === producto.codigo)
        .reduce((total, p) => total + p.cantidad, 0);
      const cantidadTotal = cantidadExistente + cantidad;

      if (cantidadTotal > producto.stock) {
        const maxCantidad = producto.stock - cantidadExistente;
        if (maxCantidad > 0) {
          toast.error(`No se puede agregar más de ${producto.stock} unidades de ${producto.descripcion}. Se puedes poner ${maxCantidad}`);
        }
        toast.error(`No se puede agregar más de ${producto.stock} unidades de ${producto.descripcion}.`);
        return prevProductos;
      }

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


  const handleGuardar = async () => {
    const almacenO = document.getElementById('almacen_origen').value;
    const almacenD = document.getElementById('almacen_destino').value || null;
    const destinatario = document.getElementById('destinatario').value;
    const glosa = document.getElementById('glosa').value;
    const fecha = document.getElementById('fechaDocu').value;
    const nota = document.getElementById('nomnota').value;
    const numComprobante = document.getElementById('numero').value;

    if (almacenO == almacenD) {
      toast.error('El almacen de origen y de destino no pueden ser el mismo.');
      return;
    }
    if (!almacenO || !destinatario || !glosa || !fecha || !nota || !numComprobante) {
      toast.error('Por favor complete todos los campos.');
      return;
    }

    if (productosSeleccionados.length === 0) {
      toast.error('Debe agregar al menos un producto.');
      return;
    }
    let stockExcedido = false;
    productosSeleccionados.forEach(producto => {
      if (producto.cantidad > producto.stock) {
        stockExcedido = true;
      }
    });

    if (stockExcedido) {
      toast.error('La cantidad de algunos productos excede el stock disponible.');
      return;
    }

    const almacenDestino = document.getElementById('almacen_destino').value;
    if (almacenDestino) {
      setConfirmationMessage('¿Desea guardar esta nueva nota de ingreso?');
    } else {
      setConfirmationMessage('No hay un almacén de destino, ¿Desea guardar de todas formas?');
    }
    openModalOpenGuardar();
  };
  

  const currentDocumento = documentos.length > 0 ? documentos[0].nota : '';
  const currentDate = new Date().toISOString().split('T')[0];

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
        <Toaster />
          <div className="flex flex-col w-1/2">
            <div className="grid grid-cols-2 gap-4">
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="almacen_origen">
                  Almacén origen:
                </label>
                <select 
                   className='form-elementwaentrada'
                  id="almacen_origen"
                  value={almacenOrigen}
                  onChange={(e) => setAlmacenOrigen(parseInt(e.target.value))}
                  disabled={productosSeleccionados.length > 0}
                >
                  <option value="">Seleccionar</option>
                  {almacenes.map(almacen => (
                    <option key={almacen.id} value={almacen.id}>{almacen.almacen}</option>
                  ))}
                </select>
                {productosSeleccionados.length > 0 && (
                  <p className="font-bold text-red-500 text-sm mt-1">
                    *Para cambiar vacíe los productos.
                  </p>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="almacen_destino">
                  Almacén destino:
                </label>
                <select 
                  className='form-elementwaentrada'
                  id="almacen_destino"

                >
                  <option value="">Seleccionar</option>
                  {almacenes.map(almacen => (
                    <option key={almacen.id} value={almacen.id}>{almacen.almacen}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="destinatario">
                  Destinatario:
                </label>
                <select 
                  className='form-elementwaentrada'
                  id="destinatario"
                  onChange={(e) => {
                    const selected = destinatarios.find(d => d.id === parseInt(e.target.value));
                    document.getElementById('ruc').value = selected ? selected.documento : '';
                  }}
                >
                  <option value="">Seleccionar</option>
                  {destinatarios.map(destinatario => (
                    <option key={destinatario.id} value={destinatario.id}>{destinatario.destinatario}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="ruc">
                  RUC:
                </label>
                <input 
className='form-elementwaentrada border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 pl-5 p-3'                  id="ruc" 
                  type="text" 
                  readOnly
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nomnota">
                  Nombre de nota:
                </label>
                <input 
className='form-elementwaentrada border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 pl-5 p-3'                  id="nomnota" 
                  type="text" 
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fechaDocu">
                  Fecha Docu:
                </label>
                <input 
                  type="date" 
                  className="form-elementwaentrada border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 pl-5 p-3"
                  id="fechaDocu" 
                  defaultValue={currentDate}
                />
              </div>
            </div>
            <div className="flex justify-start mt-4 space-x-2">
              <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button" onClick={openModalProovedor}>
                <MdPersonAdd className="inline-block mr-2 text-lg" /> Nuevo destinatario
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
                  onClick={handleCancel}
                >
                  <MdCancelPresentation className="inline-block mr-2"  /> Cancelar
                </button>
              </Link>
              <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button" onClick={handleGuardar}>
                <FiSave className="inline-block mr-2 text-lg" /> Guardar
              </button>
            </div>
          </div>
          <div className="ml-4 flex flex-col w-1/2">
          <div className="mb-8">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="numero">
                  Número:
                </label>
                <input 
                  className='form-elementwaentrada border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 pl-5 p-3 w-full'                  id="numero" 
                  type="text" 
                  value={currentDocumento} 
                  readOnly
                />
              </div>
            <div className="mb-8">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="glosa">
                Glosa:
              </label>
              <select className="form-elementwaentrada w-full" id="glosa">
                {glosaOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="observacion">
                Observación:
              </label>
              <textarea className="border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 w-full h-full" id="observacion"></textarea>
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
        setCodigoBarras={setCodigoBarras}
      />
      {isModalOpenProducto && (
        <ProductosModal modalTitle={modalTitle} onClose={closeModalProducto} />
      )}
      <AgregarProovedor isOpen={isModalOpenProovedor} onClose={closeModalProovedor} />
      {isModalOpenGuardar && (
        <ConfirmationModal
          message={confirmationMessage}
          onClose={closeModalOpenGuardar}
          isOpen={isModalOpenGuardar}
          onConfirm={handleConfirmGuardar}
        />
      )}
    </div>
  );
}

export default Registro_Ingresos;
