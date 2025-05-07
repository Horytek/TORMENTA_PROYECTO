import React, { useState, useEffect } from 'react';
//import Select from 'react-select';
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
import { handleGuiaRemisionSunat } from '../../data/add_sunat_guia'; // Asegúrate de que el path sea correcto
import ConfirmationModal from '././../../Nota_Salida/ComponentsNotaSalida/Modals/ConfirmationModal';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Button,
  Select,
  SelectItem,
  Textarea,
} from '@heroui/react';

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

    // Después de guardar localmente, llama a la función para enviar la guía a la Sunat
    const destinatario = {
      documento: document.getElementById('documento').value,
      destinatario: selectedCliente ? selectedCliente.nombre : '',
    };

    const transportista = {
      placa: document.getElementById('transporte').value || '',
    };

    handleGuiaRemisionSunat(guiaData, destinatario, transportista, productosSeleccionados);

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


  const currentDate = new Date();
  const formattedDate = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;

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
<div className="space-y-6">
  <Breadcrumb
    paths={[
      { name: 'Inicio', href: '/inicio' },
      { name: 'Almacén', href: '/almacen' },
      { name: 'Guias de Remision', href: '/almacen/guia_remision' },
      { name: 'Registrar Guía de Remisión', href: '/almacen/guia_remision/registro_guia' },
    ]}
  />
  <hr className="mb-4" />
  <h1 className="text-3xl font-bold">Nueva Guía de Remisión</h1>
  <div className="bg-gray-100 p-6 rounded-lg shadow-md">
    <form className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Columna izquierda */}
      <div className="space-y-4">
        <Input label="Número de guía" id="numero" value={currentDocumento} isReadOnly />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Fecha" id="fechaDocu" type="date" value={formattedDate}                 style={{
                  border: "none",
                  boxShadow: "none",
                  outline: "none",
                }} isReadOnly />
          <Input label="Hora" id="horaDocu" type="time" value={currentHour}                 style={{
                  border: "none",
                  boxShadow: "none",
                  outline: "none",
                }} isReadOnly />
        </div>
        <Select
          label="Cliente"
          placeholder="Seleccione..."
          onChange={(e) => {
            const selectedId = e.target.value;
            setSelectedClienteId(selectedId);
            const selected = clientes.find(cliente => cliente.id === selectedId);
            document.getElementById('documento').value = selected?.documento || '';
            document.getElementById('dirdest').value = selected?.ubicacion || '';
          }}
        >
          {clientes.map(cliente => (
            <SelectItem key={cliente.id} value={cliente.id}>
              {cliente.nombre}
            </SelectItem>
          ))}
        </Select>
        <Input label="RUC/DNI" id="documento" isReadOnly />
        <Select
          label="Vendedor"
          placeholder="Seleccione..."
          onChange={(e) => {
            const selectedId = e.target.value;
            setSelectedSucursalId(selectedId);
            const selected = sucursales.find(sucursal => sucursal.id === selectedId);
            document.getElementById('dirpart').value = selected?.direccion || '';
          }}
        >
          {sucursales.map(sucursal => (
            <SelectItem key={sucursal.id} value={sucursal.id}>
              {sucursal.nombre}
            </SelectItem>
          ))}
        </Select>
      </div>

      {/* Columna central */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Cant. Paq" id="canti" />
          <Input label="Peso Kg" id="peso" />
        </div>
        <Button
          color="warning"
          onPress={() => openModal('Ubicación de Partida / Ubicación de Destino', 'ubicacion')}
          startContent={<IoMdPin />}
        >
          Ub. de Partida/Ub. de Destino
        </Button>
        <Select label="Glosa" id="glosa">
          {glosaOptions.map(option => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Ubi. Part" id="ubipart" value={ubipart} isReadOnly />
          <Input label="Dir. Partida" id="dirpart" isReadOnly />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Ubi. Dest" id="ubidest" value={ubidest} isReadOnly />
          <Input label="Dir. Destino" id="dirdest" isReadOnly />
        </div>
      </div>

      {/* Columna derecha */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Transporte" id="namtrans" value={transporte?.empresa || transporte?.conductor || ''} isReadOnly />
          <Input label="Código Transporte" id="transporte" value={transporte?.id || ''} isReadOnly />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Button
            color="danger"
            onPress={() => openModal('Datos del Transporte', 'transporte')}
            startContent={<IoMdCar />}
          >
            Datos de Transporte
          </Button>
          <Button
            color="primary"
            onPress={() => openModal('Nuevo Cliente', 'cliente')}
            startContent={<MdPersonAdd />}
          >
            Nuevo Cliente
          </Button>
          <Button
            color="warning"
            onPress={openModalBuscarProducto}
            startContent={<FaBarcode />}
          >
            Buscar producto
          </Button>
        </div>
        <Textarea label="Observación" id="observacion"                 style={{
                          border: "none",
                          boxShadow: "none",
                          outline: "none",
                        }} />
        <Button
          color="success"
          onPress={openModalOpenGuardar}
          startContent={<FiSave />}
        >
          Guardar
        </Button>
      </div>
    </form>

    {/* Tabla de productos seleccionados */}
    <NuevaTablaGuia
      salidas={productosSeleccionados}
      setProductosSeleccionados={setProductosSeleccionados}
    />
  </div>

  {/* Modales */}
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
  {isModalOpen && modalType !== 'buscarProducto' && (
    <>
      {modalType === 'ubicacion' && <UbigeoForm modalTitle={modalTitle} onClose={closeModal} onSave={handleSaveUbigeo} />}
      {modalType === 'transporte' && <TransporteForm modalTitle={modalTitle} onClose={closeModal} onSave={handleSaveTransporte} />}
      {modalType === 'cliente' && <ClienteForm modalTitle={modalTitle} onClose={closeModal} />}
    </>
  )}
</div>
  );
}

export default RegistroGuia;
