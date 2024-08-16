import React, { useState, useEffect } from 'react';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import ModalBuscarProducto from './ComponentsNuevaNotaSalida/BuscarProductoForm';  // Asegúrate de que la ruta del componente Modal sea correcta
import { MdPersonAdd } from "react-icons/md";
import { Toaster, toast } from "react-hot-toast";
import { Link } from 'react-router-dom';
import { FiSave } from "react-icons/fi";
import { FaBarcode } from "react-icons/fa6";
import { MdCancelPresentation } from "react-icons/md";
import ProductosModal from '@/pages/Productos/ProductosForm';
import AgregarProovedor from '../ComponentsNotaSalida/Modals/AgregarProovedor';
import NuevaTablaSalida from './ComponentsNuevaNotaSalida/NuevaNotaSalidaTable';
import useProductosData from './data/data_buscar_producto';
import useDestinatarioData from '../data/data_destinatario_salida';
import useDocumentoData from '../data/data_documento_salida';
import useAlmacenData from '../data/data_almacen_salida';
import './Nueva_Nota_salida.css';
import ConfirmationModal from '././../ComponentsNotaSalida/Modals/ConfirmationModal';
import insertNotaAndDetalle from '../data/insert_nota_salida';
const glosaOptions = [
  "VENTA DE PRODUCTOS", "VENTA AL EXTERIOR", "CONSIGNACION CLIENTE",
  "TRASLADO ENTRE ALMACENES", "ITINERANTE", "CAMBIO MERCAD. PROV.",
  "MATERIA PRIMAR PRODUCCION", "DEVOLUCION PROOVEDOR", 
  "AJUSTE INVENTARIO", "OTRAS SALIDAS", "RESERVADO",
  "CONSUMO INTERNO", "EXTORNO DIFERIDO" , "TRANSFORMACION"
];
function NuevaSalidas() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenProducto, setIsModalOpenProducto] = useState(false);
  const [isModalOpenProovedor, setIsModalOpenProovedor] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [productos, setProductos] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [codigoBarras, setCodigoBarras] = useState('');
  
  // Función para manejar la entrada del código de barras
  const handleBarcodeInput = (e) => {
    setCodigoBarras(e.target.value);
  };
  const [isModalOpenGuardar, setisModalOpenGuardar] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState(''); // Nuevo estado para el mensaje de confirmación
  const [productosSeleccionados, setProductosSeleccionados] = useState(() => {
    const saved = localStorage.getItem('productosSeleccionados');
    return saved ? JSON.parse(saved) : [];
  });
  useEffect(() => {
    let barcodeInput = '';

    const handleGlobalKeyPress = (e) => {
      if (e.key === 'Enter' && e.target.value.trim() !== '') { // Filtra solo números y "Enter"
        barcodeInput += e.key;
        if (e.key === 'Enter') {
          setCodigoBarras(barcodeInput.trim());
          barcodeInput = ''; // Limpia la entrada después de procesar
        }
      } else {
        barcodeInput = ''; // Resetea la entrada si se ingresa un carácter no válido
      }
    };

    // Agrega el listener de eventos
    document.addEventListener('keydown', handleGlobalKeyPress);

    // Limpia el listener cuando el componente se desmonta
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyPress);
    };
  }, []);

  useEffect(() => {
    if (codigoBarras !== '') {
      handleBuscarProducto();
    }
  }, [codigoBarras]);

  const { almacenes } = useAlmacenData();
  const { destinatarios } = useDestinatarioData();
  const { documentos } = useDocumentoData();
  const [currentDocumento, setCurrentDocumento] = useState('');
  const [almacenOrigen, setalmacenOrigen] = useState(() => {
    const savedAlmacen = localStorage.getItem('almacen');
    return savedAlmacen ? parseInt(savedAlmacen) : '';
  });
  const [usuario, setUsuario] = useState(() => {
    const savedUsuario = localStorage.getItem('usuario');
    return savedUsuario ? (savedUsuario) : '';
  });
  useEffect(() => {
    localStorage.setItem('productosSeleccionados', JSON.stringify(productosSeleccionados));
  }, [productosSeleccionados]);

  useEffect(() => {
    if (almacenOrigen !== '') {
      localStorage.setItem('almacen', almacenOrigen.toString());
    }
  }, [almacenOrigen]);

  useEffect(() => {
    if (documentos.length > 0) {
      setCurrentDocumento(documentos[0].nota);
    }
  }, [documentos]);
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

  const openModalProducto = (title) => {
    setModalTitle(title);
    setIsModalOpenProducto(true);
  };
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
  const closeModalProducto = () => {
    setIsModalOpenProducto(false);
  };
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
    const nom_usuario = usuario;

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
      nom_usuario
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

  const openModalProovedor = () => {
    setIsModalOpenProovedor(true);
  };

  const closeModalProovedor = () => {
    setIsModalOpenProovedor(false);
  };

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

  const currentDate = new Date().toISOString().split('T')[0];

  return (
    <div>
      <Breadcrumb paths={[
        { name: 'Inicio', href: '/inicio' },
        { name: 'Almacén', href: '/almacen' },
        { name: 'Nota de salida', href: '/almacen/nota_salida' }
        , { name: 'Nueva nota de salida', href: '/almacen/nota_salida/nueva_nota_salida' }
      ]} />
      <hr className="mb-4" />
      <div className="flex justify-between mt-5 mb-4">
        <h1 className="text-xl font-bold" style={{ fontSize: '36px' }}>
          Nota de salida
        </h1>
      </div>
      <div className="container-registro-detalle-venta" style={{ backgroundColor: 'lightgray', padding: 20 }}>
        <form className="flex rounded-lg" >
          <Toaster />
          <div className="flex flex-col w-1/2">
            <div className="grid grid-cols-2 gap-4">
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="almacen_origen">
                  Almacén origen:
                </label>
                <select className='form-elementwasalida' id="almacen_origen" value={almacenOrigen} onChange={(e) => setalmacenOrigen(parseInt(e.target.value))} disabled={productosSeleccionados.length > 0}>
                  <option value="">Seleccionar</option>
                  {almacenes.map(almacen => (<option key={almacen.id} value={almacen.id}>{almacen.almacen}</option>))}
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
                <select className='form-elementwasalida' id="almacen_destino">
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
                  className='form-elementwasalida'
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
                <input className='form-elementwasalida border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 pl-5 p-3' id="ruc" type="text" readOnly />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nomnota">
                  Nombre de nota:
                </label>
                <input className='form-elementwasalida border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 pl-5 p-3' id="nomnota" type="text" />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fechaDocu">
                  Fecha Docu:
                </label>
                <input type="date" className="form-elementwasalida border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 pl-5 p-3" id="fechaDocu" defaultValue={currentDate} />
              </div>

            </div>
            <div className="flex justify-start mt-4 space-x-2">
              <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button" onClick={openModalProovedor} >
                <MdPersonAdd className="inline-block mr-2 text-lg" /> Nuevo destinatario
              </button>

              <button className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button" onClick={openModalBuscarProducto} >
                <FaBarcode className="inline-block mr-2" /> Buscar producto
              </button>

              <Link to="/almacen/nota_salida">
                <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button" onClick={handleCancel}>
                  <MdCancelPresentation className="inline-block mr-2" /> Cancelar
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
                className='form-elementwasalida border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 pl-5 p-3 w-full'
                id="numero" type="text" value={currentDocumento} readOnly
              />
            </div>
            <div className="mb-8">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="glosa">
                Glosa:
              </label>
              <select className="form-elementwasalida w-full" id="glosa">
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
          <NuevaTablaSalida
            salidas={productosSeleccionados} setProductosSeleccionados={setProductosSeleccionados}
          />
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

export default NuevaSalidas;