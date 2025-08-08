import React, { useState, useEffect } from 'react';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import { IoMdPin, IoMdCar } from 'react-icons/io';
import { MdPersonAdd } from "react-icons/md";
import ModalBuscarProducto from './ComponentsRegGuias/BuscarProdGuiaForm';
import NuevaTablaGuia from './ComponentsRegGuias/NuevaGuiaTable';
import { FiSave } from "react-icons/fi";
import { FaBarcode } from "react-icons/fa6";
import UbigeoForm from './UbigeoForm';
import useClienteData from '../../data/data_cliente_guia';
import useSucursalData from '../../data/data_sucursal_guia';
import useDocumentoData from '../../data/generar_doc_guia';
import TransporteForm from './UndTrans';
import ClienteForm from './ClienteForm';
import useProductosData from '../../data/data_buscar_producto';
import insertGuiaandDetalle from '../../data/insert_guiaremision';
import { Toaster, toast } from 'react-hot-toast';
import { handleGuiaRemisionSunat } from '../../data/add_sunat_guia';
import ConfirmationModal from './../../Nota_Salida/ComponentsNotaSalida/Modals/ConfirmationModal';
import {
  Input,
  Button,
  Select,
  SelectItem,
  Textarea,
} from '@heroui/react';
import { useUserStore } from "@/store/useStore";

const glosaOptions = [
  "COMPRA", "VENTA CON ENTREGA A TERCEROS", "TRASLADO ENTRE ALMACENES DE LA MISMA CIA.",
  "CONSIGNACION", "DEVOLUCION", "RECOJO DE BIENES TRANSFORMADOS",
  "IMPORTACION", "EXPORTACION",
  "OTROS", "VENTA SUJETA A CONFIRMACION DEL COMPRADOR", "TRASLADO DE BIENES PARA TRANSFORMACION",
  "TRASLADO EMISOR ITINERANTE CP"
];

function RegistroGuia() {
  // Estados principales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [isProductoModalOpen, setIsProductoModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [ubipart, setUbipart] = useState('');
  const [ubidest, setUbidest] = useState('');
  const [transporte, setTransporte] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [productos, setProductos] = useState([]);
  const [isModalOpenGuardar, setisModalOpenGuardar] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [selectedClienteId, setSelectedClienteId] = useState('');
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [selectedSucursalId, setSelectedSucursalId] = useState('');
  const [dirPartida, setDirPartida] = useState('');
  const [dirDestino, setDirDestino] = useState('');
  const [documentoCliente, setDocumentoCliente] = useState('');
  const [canti, setCanti] = useState('');
  const [peso, setPeso] = useState('');
  const [glosa, setGlosa] = useState('');
  const [observacion, setObservacion] = useState('');
const [productosSeleccionados, setProductosSeleccionados] = useState([]);

  // Hooks de datos
  const { clientes } = useClienteData();
  const { sucursales } = useSucursalData();
  const { documentos } = useDocumentoData();
  const nombre = useUserStore.getState().nombre;

  // Fecha y hora actual
  const currentDate = new Date();
  const formattedDate = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;
  const [currentHour, setCurrentHour] = useState(new Date().toLocaleTimeString('en-GB', { hour12: false }));
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHour(new Date().toLocaleTimeString('en-GB', { hour12: false }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentDocumento = documentos.length > 0 ? documentos[0].guia : '';

  // Actualiza datos del cliente seleccionado (DNI/RUC y dirección)
useEffect(() => {
  if (selectedClienteId) {
    const cliente = clientes.find(c => String(c.id) === String(selectedClienteId));
    setDocumentoCliente(cliente?.documento || '');
    setDirDestino(cliente?.ubicacion || '');
    setSelectedCliente(cliente);
  } else {
    setDocumentoCliente('');
    setDirDestino('');
    setSelectedCliente(null);
  }
}, [selectedClienteId, clientes]);

  // Actualiza dirección de partida al seleccionar sucursal
  useEffect(() => {
    if (selectedSucursalId) {
      const sucursal = sucursales.find(c => String(c.id) === String( selectedSucursalId));
      setDirPartida(sucursal?.direccion || '');
    }
  }, [selectedSucursalId, sucursales]);

  // Buscar productos
  const handleBuscarProducto = async () => {
    const filters = { descripcion: searchInput };
    await useProductosData(filters.descripcion, setProductos);
  };

  useEffect(() => {
    if (isProductoModalOpen) {
      handleBuscarProducto();
    }
  }, [isProductoModalOpen]);

  // Agregar producto a la tabla
  const agregarProducto = (producto, cantidad) => {
    setProductosSeleccionados((prevProductos) => {
      const cantidadExistente = prevProductos
        .filter(p => p.codigo === producto.codigo)
        .reduce((total, p) => total + p.cantidad, 0);
      const cantidadTotal = cantidadExistente + cantidad;

      if (cantidadTotal > producto.stock) {
        const maxCantidad = producto.stock - cantidadExistente;
        if (maxCantidad > 0) {
          toast.error(`No se puede agregar más de ${producto.stock} unidades de ${producto.descripcion}. Solo puedes agregar ${maxCantidad}`);
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

  // Guardar guía
  const handleGuardar = async () => {
    if (!selectedSucursalId || !selectedClienteId || !glosa || !formattedDate || !currentDocumento) {
      toast.error('Por favor complete todos los campos obligatorios.');
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

    const guiaData = {
      id_sucursal: selectedSucursalId,
      id_ubigeo_o: ubipart,
      id_ubigeo_d: ubidest,
      id_destinatario: selectedClienteId,
      id_transportista: transporte?.id || '',
      glosa,
      dir_partida: dirPartida,
      dir_destino: dirDestino,
      canti,
      peso,
      observacion,
      f_generacion: formattedDate,
      h_generacion: currentHour,
      producto: productosSeleccionados.map(p => p.codigo),
      num_comprobante: currentDocumento,
      cantidad: productosSeleccionados.map(p => p.cantidad),
    };

    const response = await insertGuiaandDetalle(guiaData);
    if (response.success) {
      toast.success("Guía de Remisión y detalles guardados exitosamente");

      const destinatario = {
        documento: documentoCliente,
        destinatario: selectedCliente ? selectedCliente.nombre : '',
      };

      const transportista = {
        placa: transporte?.placa || '',
      };

      handleGuiaRemisionSunat(guiaData, destinatario, transportista, productosSeleccionados, nombre);

      handleCancel();
      // Navegar de vuelta a la lista de guías en lugar de recargar la página
      window.history.back();
    } else {
      toast.error("Error al guardar la Guía de Remisión");
    }
  };

  // Cancelar y limpiar productos seleccionados
  const handleCancel = () => {
    setProductosSeleccionados([]);
  };

  // Confirmación de guardado
  const openModalOpenGuardar = () => {
    setConfirmationMessage('¿Desea guardar esta nueva guía de remisión?');
    setisModalOpenGuardar(true);
  };

  const handleConfirmGuardar = async () => {
    closeModalOpenGuardar();
    await handleGuardar();
  };

  const closeModalOpenGuardar = () => {
    setisModalOpenGuardar(false);
  };

  // Ubigeo
  const handleSaveUbigeo = (selectedUbipart, selectedUbidest) => {
    setUbipart(selectedUbipart);
    setUbidest(selectedUbidest);
  };

  // Transporte
  const handleSaveTransporte = (transporteData) => {
    setTransporte(transporteData);
    setIsModalOpen(false); // Solo cerrar cuando se presiona guardar
  };

  // Cliente
  const handleSaveCliente = (nuevoCliente) => {
    setIsModalOpen(false);
  };

  // Modal control
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

  const openModalBuscarProducto = () => {
    setIsProductoModalOpen(true);
    handleBuscarProducto();
  };

  const closeModalBuscarProducto = () => setIsProductoModalOpen(false);

  // --- Render ---
  return (
    <div className="space-y-6">
      <Toaster />
      <h1 className="text-3xl font-bold">Nueva Guía de Remisión</h1>
      <div className="bg-gray-200 p-6 rounded-lg shadow-md">
        <form className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda */}
          <div className="space-y-4">
            <Input label="Número de guía" value={currentDocumento} isReadOnly />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Fecha" type="date" value={formattedDate} style={{ border: "none", boxShadow: "none", outline: "none" }} isReadOnly />
              <Input label="Hora" type="time" value={currentHour} style={{ border: "none", boxShadow: "none", outline: "none" }} isReadOnly />
            </div>
            <Select
              label="Cliente"
              placeholder="Seleccione..."
              selectedKeys={selectedClienteId ? new Set([selectedClienteId]) : new Set()}
              onSelectionChange={(keys) => {
                const key = Array.from(keys)[0] || '';
                setSelectedClienteId(key);
              }}
            >
              {clientes.map(cliente => (
                <SelectItem key={cliente.id} value={cliente.id}>
                  {cliente.nombre}
                </SelectItem>
              ))}
            </Select>
            <Input
              label="DNI / RUC"
              value={documentoCliente}
              isReadOnly
            />
            <Select
              label="Sucursal"
              placeholder="Seleccione..."
              className="w-full pb-4"
              selectedKeys={selectedSucursalId ? new Set([selectedSucursalId]) : new Set()}
              onSelectionChange={(keys) => {
                const key = Array.from(keys)[0] || '';
                setSelectedSucursalId(key);
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
              <Input label="Cant. Paq" value={canti} onChange={e => setCanti(e.target.value)} />
              <Input label="Peso Kg" value={peso} onChange={e => setPeso(e.target.value)} />
            </div>
            <Button
              color="warning"
              onPress={() => openModal('Ubicación de Partida / Ubicación de Destino', 'ubicacion')}
              startContent={<IoMdPin />}
            >
              Ub. de Partida/Ub. de Destino
            </Button>
            <Select label="Glosa" value={glosa} onChange={e => setGlosa(e.target.value)}>
              {glosaOptions.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </Select>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Ubi. Part" value={ubipart} isReadOnly />
              <Input label="Dir. Partida" value={dirPartida} isReadOnly onChange={e => setDirPartida(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Ubi. Dest" value={ubidest} isReadOnly />
              <Input label="Dir. Destino" value={dirDestino} onChange={e => setDirDestino(e.target.value)}   isReadOnly/>
            </div>
          </div>

          {/* Columna derecha */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Transporte" value={transporte?.empresa || transporte?.conductor || ''} isReadOnly />
              <Input label="Código Transporte" value={transporte?.id || ''} isReadOnly />
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
            <Textarea label="Observación" value={observacion} onChange={e => setObservacion(e.target.value)} style={{ border: "none", boxShadow: "none", outline: "none" }} />
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
        onClose={closeModalOpenGuardar}   // <--- Cambia esto
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