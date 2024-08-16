import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import { IoMdPin, IoMdCar, IoMdAdd, IoIosSearch } from 'react-icons/io';
import { MdPersonAdd } from "react-icons/md";
import ModalBuscarProducto from './ComponentsRegGuias/BuscarProdGuiaForm';
import NuevaTablaGuia from '../../Nota_Salida/Nueva_Nota_Salida/ComponentsNuevaNotaSalida/NuevaNotaSalidaTable';
import { FiSave } from "react-icons/fi";
import { FaBarcode } from "react-icons/fa6";
import UbigeoForm from './UbigeoForm';
import useClienteData from '../../data/data_cliente_guia';
import useSucursalData from '../../data/data_sucursal_guia';
import useDocumentoData from '../../data/generar_doc_guia';
import TransporteForm from './UndTrans';
import ClienteForm from './ClienteForm';
import ProductosForm from '@/pages/Productos/ProductosForm';
import useProductosData from '../../data/data_buscar_producto';
import insertGuiaandDetalle from '../../data/insert_guiaremision';
import { Toaster, toast } from 'react-hot-toast'; // <-- Importación añadida
import ConfirmationModal from '././../../Nota_Salida/ComponentsNotaSalida/Modals/ConfirmationModal';


const glosaOptions = [
  "COMPRA", "VENTA CON ENTREGA A TERCEROS", "TRASLADO ENTRE ALMACENES DE LA MISMA CIA.",
  "CONSIGNACION", "DEVOLUCION", "RECOJO DE BIENES TRANSFORMADOS",
  "IMPORTACION", "EXPORTACION",
  "OTROS", "VENTA SUJETA A CONFIRMACION DEL COMPRADOR", "TRASLADO DE BIENES PARA TRANSFORMACION",
  "TRASLADO EMISOR ITINERANTE CP"
];

function RegistroGuia() {

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [isProductoModalOpen, setIsProductoModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const { clientes } = useClienteData();
  const { sucursales } = useSucursalData();
  const { documentos } = useDocumentoData();
  const [ubipart, setUbipart] = useState('');
  const [ubidest, setUbidest] = useState('');
  const [transporte, setTransporte] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [productos, setProductos] = useState([]); // Tu array de productos

  const [isModalOpenGuardar, setisModalOpenGuardar] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');

  const [selectedClienteId, setSelectedClienteId] = useState(null);
  const [selectedSucursalId, setSelectedSucursalId] = useState(null);


  const handleCancel = () => {
    localStorage.removeItem('productosSeleccionados');
    setProductosSeleccionados([]);
  };

  const handleGuardar = async () => {

    if (productosSeleccionados.length === 0) {
      toast.error('Debe agregar al menos un producto.');
      return;
    }

    const id_sucursal = selectedSucursalId; // ID de la sucursal seleccionada
    const id_ubigeo_o = document.getElementById('ubipart').value;
    const id_ubigeo_d = document.getElementById('ubidest').value;
    const id_destinatario = selectedClienteId; // ID del cliente seleccionado
    const id_transportista = document.getElementById('transporte').value;
    const glosa = document.getElementById('glosa').value;
    const dir_partida = document.getElementById('dirpart').value;
    const dir_destino = document.getElementById('dirdest').value;
    const canti = document.getElementById('canti').value;
    const peso = document.getElementById('peso').value;
    const observacion = document.getElementById('observacion').value;
    const f_generacion = document.getElementById('fechaDocu').value;
    const h_generacion = document.getElementById('horaDocu').value;
    const num_comprobante = document.getElementById('numero').value;

    const productos = productosSeleccionados.map(producto => ({
      id: producto.codigo,
      cantidad: producto.cantidad
    }));

    const guiaData = {
      id_sucursal,
      id_ubigeo_o,
      id_ubigeo_d,
      id_destinatario,
      id_transportista,
      glosa,
      dir_partida,
      dir_destino,
      canti,
      peso,
      observacion,
      f_generacion,
      h_generacion,
      producto: productos.map(p => p.id),
      num_comprobante,
      cantidad: productos.map(p => p.cantidad),
    };

    const response = await insertGuiaandDetalle(guiaData); // Pasar solo guiaData
    console.log(response);
    if (response.success) {
      toast.success("Guía de Remisión y detalles guardados exitosamente");
      handleCancel();
      window.location.reload();
    } else {
      toast.error("Error al guardar la Guía de Remisión");
    }

  };


  const [productosSeleccionados, setProductosSeleccionados] = useState(() => {
    const saved = localStorage.getItem('productosSeleccionados');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('productosSeleccionados', JSON.stringify(productosSeleccionados));
  }, [productosSeleccionados]);

  const handleBuscarProducto = async () => {
    const filters = {
      descripcion: searchInput,
    };
    await useProductosData(filters.descripcion, setProductos);
  };

  useEffect(() => {
    if (isProductoModalOpen) {
      handleBuscarProducto();
    }
  }, [isProductoModalOpen]);




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

  const openModalOpenGuardar = () => {
    setConfirmationMessage('¿Desea guardar esta nueva guía de remisión?');
    setisModalOpenGuardar(true);
  };

  const handleConfirmGuardar = async () => {
    closeModalOpenGuardar();
    await handleGuardar(); // Aquí llamas la función de guardado
  };

  const closeModalOpenGuardar = () => {
    setisModalOpenGuardar(false);
  };




  const [selectedCliente, setSelectedCliente] = useState(null);

  const openModalBuscarProducto = () => {
    setIsProductoModalOpen(true);
    handleBuscarProducto();
  };

  const closeModalBuscarProducto = () => setIsProductoModalOpen(false);



  const handleClienteChange = (e) => {
    const selectedId = e.target.value;
    const cliente = clientes.find(cliente => cliente.id === selectedId);
    setSelectedCliente(cliente);
  };

  const handleSaveUbigeo = (selectedUbipart, selectedUbidest) => {
    setUbipart(selectedUbipart);
    setUbidest(selectedUbidest);
  };

  const handleSaveTransporte = (transporte) => {
    setTransporte(transporte);
  };

  const clienteOptions = clientes.map(cliente => ({
    value: cliente.id,
    label: cliente.nombre,
  }));


  const currentDate = new Date().toISOString().split('T')[0];

  const [currentHour, setCurrentHour] = useState(new Date().toLocaleTimeString('en-GB', { hour12: false }));
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHour(new Date().toLocaleTimeString('en-GB', { hour12: false }));
    }, 1000);

    return () => clearInterval(interval); // Limpia el intervalo al desmontar el componente
  }, []);


  const openModal = (title, type) => {
    setModalTitle(title);
    setModalType(type);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalTitle('');
    setModalType('');
  };

  const currentDocumento = documentos.length > 0 ? documentos[0].guia : '';


  return (
    <div>
      <Breadcrumb paths={[{ name: 'Inicio', href: '/inicio' },
      { name: 'Almacén', href: '/almacen' },
      { name: 'Guias de Remision', href: '/almacen/guia_remision' },
      { name: 'Registrar Guía de Remisión', href: '/almacen/guia_remision/registro_guia' }]} />
      <hr className="mb-4" />
      <div className="flex justify-between mt-5 mb-4">
        <h1 className="text-xl font-bold" style={{ fontSize: '36px' }}>
          Nueva Guía de Remisión
        </h1>
      </div>
      <div className="rounded" style={{ backgroundColor: '#F2F3F4' }}>

        <div className="flex rounded" style={{ backgroundColor: '#F2F3F4', padding: 10 }}>
          <div className="flex flex-col w-1/2">
            <div className="grid grid-cols-2 gap-4">
              <div className="">
                <div className='w-full relative group text-start'>
                  <label htmlFor="numero" className='text-sm font-bold text-black'>Número de guía:</label>
                  <input id="numero"
                    type="text"
                    value={currentDocumento}
                    className='w-full bg-gray-200 border-gray-300 text-black rounded-lg border p-1 ' disabled />
                </div>
              </div>
              <div className="flex">
                <div className="flex-1 mr-2">
                  <label htmlFor="fechaDocu" className='text-sm font-bold text-black'>Fecha:</label>
                  <input type="date" name='fechaDocu'
                    className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5'
                    id="fechaDocu" defaultValue={currentDate} readOnly />
                </div>
                <div className="flex-1 ml-2">
                  <label htmlFor="horaDocu" className='text-sm font-bold text-black'>Hora:</label>
                  <input type="time" name='horaDocu'
                    className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5'
                    id="horaDocu" value={currentHour} readOnly />
                </div>
              </div>
              <div className="">
    <label htmlFor="cliente" className='text-sm font-bold text-black'>Cliente:</label>
    <Select
        id='cliente'
        classNamePrefix='react-select'
        options={clientes.map(cliente => ({ value: cliente.id, label: cliente.nombre }))}
        onChange={(selectedOption) => {
            const selectedId = selectedOption ? selectedOption.value : null;
            setSelectedClienteId(selectedId);

            const selected = clientes.find(cliente => cliente.id === selectedId);

            if (selected) {
                document.getElementById('documento').value = selected.documento;
                document.getElementById('dirdest').value = selected.ubicacion;
            } else {
                document.getElementById('documento').value = '';
                document.getElementById('dirdest').value = '';
            }
        }}
        placeholder="Seleccione..."
    />
</div>
              <div className="">
                <div className='w-full relative group text-start'>
                  <label htmlFor="documento" className='text-sm font-bold text-black'>RUC/DNI:</label>
                  <input type="text"
                    name='documento'
                    id="documento"
                    className='w-full bg-gray-200 border-gray-300 text-gray-900 rounded-lg border p-1' disabled />
                </div>
              </div>

              <div className='w-full relative group text-start'>
    <label htmlFor="vendedor" className='text-sm font-bold text-black'>Vendedor:</label>
    <Select
        id='vendedor'
        classNamePrefix='react-select'
        options={sucursales.map(sucursal => ({ value: sucursal.id, label: sucursal.nombre }))}
        onChange={(selectedOption) => {
            const selectedId = selectedOption ? selectedOption.value : null;
            setSelectedSucursalId(selectedId);

            const selected = sucursales.find(sucursal => sucursal.id === selectedId);

            if (selected) {
                document.getElementById('dirpart').value = selected.direccion;
            } else {
                document.getElementById('dirpart').value = '';
            }
        }}
        placeholder="Seleccione..."
    />
</div>
              <div className="flex">
                <div className="flex-1 mr-2">
                  <label htmlFor="canti" className="block text-gray-700 text-sm font-bold ">Cant. Paq:</label>
                  <input type="text" name='canti' id='canti' className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5' />
                </div>
                <div className="flex-1 ml-2">
                  <label htmlFor="peso" className="block text-gray-700 text-sm font-bold">Peso Kg:</label>
                  <input type="text" name='peso' id='peso' className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5' />
                </div>
              </div>
              <div className="">
                <label className="block text-gray-700 text-sm font-bold mt-5" htmlFor="ubigeo">
                </label>
                <button className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-2 rounded"
                  type="button" onClick={() => openModal('Ubicación de Partida / Ubicación de Destino', 'ubicacion')}>
                  <IoMdPin className="inline-block mr-2" /> Ub. de Partida/Ub. de Destino
                </button>
              </div>
              <div className="">
                <label htmlFor="glosa" className='text-sm font-bold text-black'>Glosa.Sal:</label>
                <select id='glosa' className='w-full text-sm bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-2'>
                  <option>Seleccione...</option>
                  {glosaOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="">
                <div className='w-full relative group text-start'>
                  <label htmlFor="ubipart" className='text-sm font-bold text-black'>Ubi. Part:</label>
                  <input
                    type="text"
                    name='ubipart'
                    id='ubipart'
                    value={ubipart}
                    className='w-full bg-gray-200 border-gray-300 text-gray-900 rounded-lg border p-1'
                    disabled
                  />
                </div>
              </div>
              <div className="">
                <div className='w-full relative group text-start'>
                  <label htmlFor="dirpart" className='text-sm font-bold text-black'>Dir. Partida:</label>
                  <input type="text" name='dirpart'
                    id='dirpart'
                    className='w-full bg-gray-200 border-gray-300 text-gray-900 rounded-lg border p-1'
                    disabled />
                </div>
              </div>
              <div className="">
                <div className='w-full relative group mb-5 text-start'>
                  <label htmlFor="ubidest" className='text-sm font-bold text-black'>Ubi. Dest:</label>
                  <input
                    type="text"
                    name='ubidest'
                    id='ubidest'
                    value={ubidest}
                    className='w-full bg-gray-200 border-gray-300 text-gray-900 rounded-lg border p-1'
                    disabled
                  />
                </div>
              </div>
              <div className="">
                <div className='w-full relative group text-start'>
                  <label htmlFor="dirdest" className='text-sm font-bold text-black'>Dir. Destino:</label>
                  <input type="text"
                    id='dirdest'
                    className='w-full bg-gray-200 border-gray-300 text-gray-900 rounded-lg border p-1'
                    disabled />
                </div>
              </div>

              <div className="">
                <div className='w-full relative group text-start'>
                  <label htmlFor="namtrans" className='text-sm font-bold text-black'>Transporte:</label>
                  <input
                    type="text"
                    name='namtrans'
                    id='namtrans'
                    value={transporte ? `${transporte.empresa || transporte.conductor}` : ''}
                    className='w-full bg-gray-200 border-gray-300 text-gray-900 rounded-lg border p-1'
                    disabled
                  />
                </div>
              </div>
              <div className="flex">
                <div className="flex-1 mr-2">
                  <label htmlFor="transport" className="block text-gray-700 text-sm font-bold  "></label>
                  <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm"
                    type="button" onClick={() => openModal('Datos del Transporte', 'transporte')}>
                    <IoMdCar className="inline-block mr-2 text-lg" /> Datos de Transporte
                  </button>
                </div>
                <div className="flex-1 ml-2">
                  <label htmlFor="peso" className="block text-gray-700 text-sm font-bold"></label>
                  <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
                    type="button" onClick={() => openModal('Nuevo Cliente', 'cliente')}>
                    <MdPersonAdd className="inline-block mr-2 text-lg" />Nuevo Cliente
                  </button>
                </div>
              </div>
              <div className="">
                <div className='w-full relative group text-start'>
                  <label htmlFor="transporte" className='text-sm font-bold text-black'>Código Transporte:</label>
                  <input
                    type="text"
                    name='transporte'
                    id='transporte'
                    value={transporte ? `${transporte.id}` : ''}
                    className='w-full bg-gray-200 border-gray-300 text-gray-900 rounded-lg border p-1'
                    disabled
                  />
                </div>
              </div>

              <div className="">
                <div className='w-full relative group text-start'>
                  <label htmlFor="peso" className="block text-gray-700 text-sm font-bold mt-6"></label>
                  <button className="bg-yellow-500 hover:bg-yellow-600 text-black w-full font-bold py-1.5 px-4 rounded"
                    type="button" onClick={openModalBuscarProducto}>
                    <FaBarcode className="inline-block mr-2" /> Buscar producto
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="ml-4 flex flex-col w-1/2">
            <div className="flex-1">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="observacion">
                Observación:
              </label>
              <textarea className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight resize-none"
                id="observacion" style={{ height: "94%" }}></textarea>
            </div>
            <div className="mt-10 flex justify-end">
              <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-1.5 px-4 rounded" type="button" onClick={openModalOpenGuardar}>
                <FiSave className="inline-block mr-2 text-lg" /> Guardar
              </button>
            </div>
          </div>
        </div>

        <br />
        <NuevaTablaGuia
          salidas={productosSeleccionados} setProductosSeleccionados={setProductosSeleccionados}
        />
      </div>
      <ModalBuscarProducto
        isOpen={isProductoModalOpen}
        onClose={closeModalBuscarProducto}
        onBuscar={handleBuscarProducto}
        setSearchInput={setSearchInput}
        productos={productos}
        agregarProducto={agregarProducto}
      />
      <ConfirmationModal
        isOpen={isModalOpenGuardar}
        onRequestClose={closeModalOpenGuardar}
        onConfirm={handleConfirmGuardar}
        title="Confirmación"
        message={confirmationMessage}
      />
      {/* Modals */}
      {isModalOpen && modalType !== 'buscarProducto' && (
        <>
          {modalType === 'ubicacion' && <UbigeoForm modalTitle={modalTitle} onClose={closeModal} onSave={handleSaveUbigeo} />}
          {modalType === 'transporte' && <TransporteForm modalTitle={modalTitle} onClose={closeModal} onSave={handleSaveTransporte} />}
          {modalType === 'cliente' && <ClienteForm modalTitle={modalTitle} onClose={closeModal} />}
          {modalType === 'producto' && <ProductosForm modalTitle={modalTitle} onClose={closeModal} />}
        </>
      )}
    </div>
  );
}

export default RegistroGuia;
