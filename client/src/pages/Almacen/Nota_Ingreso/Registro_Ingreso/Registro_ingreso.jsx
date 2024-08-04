import { useState, useEffect } from 'react';
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
  const [productosSeleccionados, setProductosSeleccionados] = useState(() => {
    const saved = localStorage.getItem('productosSeleccionados');
    return saved ? JSON.parse(saved) : [];
  });

  const { almacenes } = useAlmacenData();
  const { destinatarios } = useDestinatarioData();
  const { documentos } = useDocumentoData();

  const [almacenDestino, setAlmacenDestino] = useState(() => {
    const savedAlmacen = localStorage.getItem('almacen');
    return savedAlmacen ? parseInt(savedAlmacen) : '';
  });

  useEffect(() => {
    localStorage.setItem('productosSeleccionados', JSON.stringify(productosSeleccionados));
  }, [productosSeleccionados]);

  useEffect(() => {
    if (almacenDestino !== '') {
      localStorage.setItem('almacen', almacenDestino.toString());
    }
  }, [almacenDestino]);

  const openModalBuscarProducto = () => setIsModalOpen(true);
  const closeModalBuscarProducto = () => setIsModalOpen(false);

  const openModalProducto = (title) => {
    setModalTitle(title);
    setIsModalOpenProducto(true);
  };

  const closeModalProducto = () => setIsModalOpenProducto(false);
  const openModalProovedor = () => setIsModalOpenProovedor(true);
  const closeModalProovedor = () => setIsModalOpenProovedor(false);

  const handleBuscarProducto = async () => {
    const almacenId = almacenDestino || 1;
    const filters = {
      descripcion: searchInput,
      almacen: almacenId,
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

  const handleGuardar = async () => {
    const almacenO = document.getElementById('almacen_origen').value;
    const almacenD = document.getElementById('almacen_destino').value;
    const destinatario = document.getElementById('destinatario').value;
    const glosa = document.getElementById('glosa').value;
    const fecha = document.getElementById('fechaDocu').value;
    const nota = document.getElementById('proveedor').value;
    const numComprobante = document.getElementById('numero').value;
    const observacion = document.getElementById('observacion').value;

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
      observacion
    };

    const result = await insertNotaAndDetalle(data);

    if (result.success) {
      alert('Nota y detalle insertados correctamente');
      handleCancel();
    } else {
      alert('Error al insertar nota y detalle: ' + result.message);
    }
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
          <div className="flex flex-col w-1/2">
            <div className="grid grid-cols-2 gap-4">
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="almacen_origen">
                  Almacén origen:
                </label>
                <select className='border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 pl-10 p-2.5' id="almacen_origen">
                <option value="">Seleccionar</option>
                  {almacenes.map(almacen => (
                    <option key={almacen.id} value={almacen.id}>{almacen.almacen}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="almacen_destino">
                  Almacén destino:
                </label>
                <select 
                  className='border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 pl-10 p-2.5' 
                  id="almacen_destino"
                  value={almacenDestino}
                  onChange={(e) => setAlmacenDestino(parseInt(e.target.value))}
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
                  className='border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 pl-10 p-2.5' 
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
                  className='border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 pl-10 p-2.5' 
                  id="ruc" 
                  type="text" 
                  readOnly
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="proveedor">
                  Proveedor:
                </label>
                <input 
                  className='border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 pl-10 p-2.5' 
                  id="proveedor" 
                  type="text" 
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fechaDocu">
                  Fecha Docu:
                </label>
                <input 
                  type="date" 
                  className="border border-gray-300 rounded-lg p-2.5" 
                  id="fechaDocu" 
                  defaultValue={currentDate}
                />
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
          <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="numero">
                  Número:
                </label>
                <input 
                  className='border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 pl-10 p-2.5' 
                  id="numero" 
                  type="text" 
                  value={currentDocumento} 
                  readOnly
                />
              </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="glosa">
                Glosa:
              </label>
              <select className="border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 pl-10 p-2.5 w-full" id="glosa">
                {glosaOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="observacion">
                Observación:
              </label>
              <textarea className="border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 pl-10 p-2.5 w-full h-full" id="observacion"></textarea>
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
