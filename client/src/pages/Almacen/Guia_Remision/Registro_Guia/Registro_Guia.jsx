import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { IoMdPin, IoMdCar } from 'react-icons/io';
import { MdPersonAdd } from "react-icons/md";
import { FiSave } from "react-icons/fi";
import { FaBarcode } from "react-icons/fa6";
import { Toaster, toast } from 'react-hot-toast';

import ModalBuscarProducto from './ComponentsRegGuias/BuscarProdGuiaForm';
import NuevaTablaGuia from './ComponentsRegGuias/NuevaGuiaTable';
import UbigeoForm from './UbigeoForm';
import TransporteForm from './UndTrans';
import ClienteForm from './ClienteForm';

import useProductosData from '../../data/data_buscar_producto';
import { 
  getDestinatariosGuia, 
  getSucursalesGuia, 
  generarDocumentoGuia,
  insertGuiaRemisionAndDetalle 
} from '@/services/guiaRemision.services';
import { handleGuiaRemisionSunat } from '../../data/add_sunat_guia';
import ConfirmationModal from './../../Nota_Salida/ComponentsNotaSalida/Modals/ConfirmationModal';

import {
  Input,
  Button,
  Select,
  SelectItem,
  Textarea,
  Card,
  CardHeader,
  CardBody,
  Divider,
  Chip,
  ScrollShadow
} from '@heroui/react';
import { useUserStore } from "@/store/useStore";

const GLOSA_OPTIONS = [
  "COMPRA", "VENTA CON ENTREGA A TERCEROS", "TRASLADO ENTRE ALMACENES DE LA MISMA CIA.",
  "CONSIGNACION", "DEVOLUCION", "RECOJO DE BIENES TRANSFORMADOS",
  "IMPORTACION", "EXPORTACION", "OTROS", "VENTA SUJETA A CONFIRMACION DEL COMPRADOR",
  "TRASLADO DE BIENES PARA TRANSFORMACION", "TRASLADO EMISOR ITINERANTE CP"
];

// --- Helpers ---
const formatDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function RegistroGuia() {
  // Datos externos - Ahora usando servicios consolidados
  const [clientes, setClientes] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const nombreUsuario = useUserStore.getState().nombre;
  const lastTermRef = useRef('');
  const loadingRef = useRef(false);
  
  // Cargar datos iniciales en paralelo
  useEffect(() => {
    const fetchInitialData = async () => {
      const [clientesRes, sucursalesRes, documentoRes] = await Promise.all([
        getDestinatariosGuia(),
        getSucursalesGuia(),
        generarDocumentoGuia()
      ]);
      
      if (clientesRes.success) setClientes(clientesRes.data);
      if (sucursalesRes.success) setSucursales(sucursalesRes.data);
      if (documentoRes.success) setDocumentos(documentoRes.data);
    };
    
    fetchInitialData();
  }, []);

  // Estado principal
  const [selectedClienteId, setSelectedClienteId] = useState('');
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [selectedSucursalId, setSelectedSucursalId] = useState('');
  const [documentoCliente, setDocumentoCliente] = useState('');
  const [dirPartida, setDirPartida] = useState('');
  const [dirDestino, setDirDestino] = useState('');
  const [ubipart, setUbipart] = useState('');
  const [ubidest, setUbidest] = useState('');
  const [transporte, setTransporte] = useState(null);

  const [canti, setCanti] = useState('');
  const [peso, setPeso] = useState('');
  const [glosa, setGlosa] = useState('');
  const [observacion, setObservacion] = useState('');
  const [productos, setProductos] = useState([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [loadingProductos, setLoadingProductos] = useState(false);

  // Documento / fecha / hora
  const currentDocumento = documentos.length ? (documentos[0].guia || '') : '';
  const [currentHour, setCurrentHour] = useState(new Date().toLocaleTimeString('en-GB', { hour12: false }));
  const [todayString] = useState(formatDate(new Date()));

  // Modales genéricos
  const [modalType, setModalType] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal buscar producto
  const [isProductoModalOpen, setIsProductoModalOpen] = useState(false);

  // Confirmación guardar
  const [isModalOpenGuardar, setIsModalOpenGuardar] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');

  // Hora en vivo
  useEffect(() => {
    const int = setInterval(() => {
      setCurrentHour(new Date().toLocaleTimeString('en-GB', { hour12: false }));
    }, 1000);
    return () => clearInterval(int);
  }, []);

  // Actualizar datos cliente
  useEffect(() => {
    if (selectedClienteId) {
      const cli = clientes.find(c => String(c.id) === String(selectedClienteId));
      setSelectedCliente(cli || null);
      setDocumentoCliente(cli?.documento || '');
      setDirDestino(cli?.ubicacion || '');
    } else {
      setSelectedCliente(null);
      setDocumentoCliente('');
      setDirDestino('');
    }
  }, [selectedClienteId, clientes]);

  // Actualizar dirección sucursal
  useEffect(() => {
    if (selectedSucursalId) {
      const suc = sucursales.find(s => String(s.id) === String(selectedSucursalId));
      setDirPartida(suc?.direccion || '');
    } else {
      setDirPartida('');
    }
  }, [selectedSucursalId, sucursales]);

  // Sucursales únicas (por id). Si hay duplicados de id pero difieren en nombre, conserva el primero.
  const sucursalesUnicas = useMemo(() => {
    const seen = new Set();
    return (sucursales || []).filter(s => {
      if (!s || seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }, [sucursales]);

  // Carga productos (con memo y supresión de duplicados)
  const loadProductos = useCallback(async (term = '') => {
    const normalizado = term.trim();
    if (loadingRef.current) return;
    if (normalizado === lastTermRef.current && productos.length) return;
    lastTermRef.current = normalizado;
    loadingRef.current = true;
    setLoadingProductos(true);
    try {
      await useProductosData(normalizado, setProductos);
    } catch (e) {
      // el hook interno ya hace toast; aquí solo evitamos ruido extra
      console.error('Fallo carga productos:', e?.message);
    } finally {
      setLoadingProductos(false);
      loadingRef.current = false;
    }
  }, [productos.length]);

  // Cargar al abrir modal + cuando cambia el criterio de búsqueda
  useEffect(() => {
    if (isProductoModalOpen) {
      loadProductos(searchInput);
    }
  }, [isProductoModalOpen, searchInput, loadProductos]);

  // Abrir modal buscar producto
  const openModalBuscarProducto = () => {
    setIsProductoModalOpen(true);
    if (!productos.length) {
      loadProductos('');
    }
  };
  
  const closeModalBuscarProducto = () => setIsProductoModalOpen(false);

  // Control modal genérico
  const openModal = (title, type) => {
    setModalTitle(title);
    setModalType(type);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setModalType('');
    setModalTitle('');
  };

  // Guardar datos de submodales
  const handleSaveUbigeo = (uPart, uDest) => {
    setUbipart(uPart);
    setUbidest(uDest);
  };
  const handleSaveTransporte = (data) => {
    setTransporte(data);
    closeModal();
  };
  const handleSaveCliente = () => {
    closeModal();
  };

  // Agregar producto a la lista
  const agregarProducto = useCallback((producto, cantidad) => {
    setProductosSeleccionados(prev => {
      const existente = prev.find(p => p.codigo === producto.codigo);
      const totalPrev = prev.filter(p => p.codigo === producto.codigo)
        .reduce((acc, p) => acc + p.cantidad, 0);
      const nuevoTotal = totalPrev + cantidad;

      if (nuevoTotal > producto.stock) {
        const restante = producto.stock - totalPrev;
        if (restante > 0) {
          toast.error(`Máximo disponible ${producto.stock}. Puedes añadir solo ${restante} más.`);
        } else {
          toast.error(`Stock máximo (${producto.stock}) ya alcanzado.`);
        }
        return prev;
      }

      if (existente) {
        return prev.map(p =>
          p.codigo === producto.codigo
            ? { ...p, cantidad: p.cantidad + cantidad }
            : p
        );
      }
      return [...prev, { ...producto, cantidad }];
    });
    closeModalBuscarProducto();
  }, []);

  // Eliminar todos
  const handleCancel = () => setProductosSeleccionados([]);

  // Validaciones agrupadas
  const validateBeforeSave = () => {
    const errors = [];
    if (!selectedSucursalId) errors.push('Seleccione una sucursal');
    if (!selectedClienteId) errors.push('Seleccione un cliente');
    if (!glosa) errors.push('Seleccione una glosa');
    if (!currentDocumento) errors.push('Documento no disponible');
    if (!productosSeleccionados.length) errors.push('Agregue al menos un producto');
    if (!ubipart) errors.push('Ingrese el ubigeo de partida');
    if (!ubidest) errors.push('Ingrese el ubigeo de destino');

    const stockInvalid = productosSeleccionados.some(p => p.cantidad > p.stock);
    if (stockInvalid) errors.push('Alguna cantidad excede el stock');

    if (errors.length) {
      errors.forEach(e => toast.error(e));
      return false;
    }
    return true;
  };

  // Preparar datos
  const guiaData = useMemo(() => ({
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
    f_generacion: todayString,
    h_generacion: currentHour,
    producto: productosSeleccionados.map(p => p.codigo),
    num_comprobante: currentDocumento,
    cantidad: productosSeleccionados.map(p => p.cantidad),
  }), [
    selectedSucursalId, ubipart, ubidest, selectedClienteId, transporte,
    glosa, dirPartida, dirDestino, canti, peso, observacion,
    todayString, currentHour, productosSeleccionados, currentDocumento
  ]);

  // Guardar
  const handleGuardar = async () => {
    if (!validateBeforeSave()) return;
    try {
      const resp = await insertGuiaRemisionAndDetalle(guiaData);
      if (!resp.success) {
        toast.error(resp.message || 'Error al guardar la guía');
        return;
      }
      toast.success('Guía guardada');

      const destinatarioPayload = {
        documento: documentoCliente,
        destinatario: selectedCliente?.nombre || '',
      };
      const transportistaPayload = {
        placa: transporte?.placa || '',
      };
      handleGuiaRemisionSunat(
        guiaData,
        destinatarioPayload,
        transportistaPayload,
        productosSeleccionados,
        nombreUsuario
      );

      handleCancel();
      window.history.back();
    } catch (e) {
      console.error(e);
      toast.error('Error inesperado al guardar');
    }
  };

  // Confirmación
  const openModalOpenGuardar = () => {
    setConfirmationMessage('¿Desea guardar esta nueva guía de remisión?');
    setIsModalOpenGuardar(true);
  };
  const handleConfirmGuardar = async () => {
    setIsModalOpenGuardar(false);
    await handleGuardar();
  };
  const closeModalOpenGuardar = () => setIsModalOpenGuardar(false);

  const canShowResumen = productosSeleccionados.length > 0;

  return (
    <div className="space-y-6">
      <Toaster />
      <Card className="bg-white dark:bg-zinc-900 border border-blue-100/60 dark:border-zinc-700/60 shadow-md rounded-2xl">
        <CardHeader className="flex flex-col gap-2 items-start">
          <h1 className="text-2xl font-bold text-blue-900 dark:text-blue-100">Nueva Guía de Remisión</h1>
          <div className="flex flex-wrap gap-2">
            <Chip color="primary" variant="flat" className="text-xs">
              Doc: {currentDocumento || '...'}
            </Chip>
            <Chip color="default" variant="flat" className="text-xs">
              Hora: {currentHour}
            </Chip>
            {canShowResumen && (
              <Chip color="success" variant="flat" className="text-xs">
                Productos: {productosSeleccionados.length}
              </Chip>
            )}
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="space-y-6">
          <form className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Izquierda */}
            <div className="space-y-4">
              <Input label="Número de guía" value={currentDocumento} isReadOnly />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Fecha" type="date" value={todayString} isReadOnly />
                <Input label="Hora" type="time" value={currentHour} isReadOnly />
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
                {clientes.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                ))}
              </Select>
              <Input label="DNI / RUC" value={documentoCliente} isReadOnly />
              <Select
                label="Sucursal"
                placeholder="Seleccione..."
                selectedKeys={selectedSucursalId ? new Set([selectedSucursalId]) : new Set()}
                onSelectionChange={(keys) => {
                  const key = Array.from(keys)[0] || '';
                  setSelectedSucursalId(key);
                }}
              >
                {sucursalesUnicas.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
                ))}
              </Select>
            </div>

            {/* Centro */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Cant. Paq" value={canti} onChange={e => setCanti(e.target.value)} />
                <Input label="Peso Kg" value={peso} onChange={e => setPeso(e.target.value)} />
              </div>
              <Button
                variant="flat"
                color="warning"
                onPress={() => openModal('Ubicación de Partida / Destino', 'ubicacion')}
                startContent={<IoMdPin />}
              >
                Ubigeo Partida / Destino
              </Button>
              <Select
                label="Glosa"
                placeholder="Seleccione..."
                selectedKeys={glosa ? new Set([glosa]) : new Set()}
                onSelectionChange={(k) => setGlosa(Array.from(k)[0] || '')}
              >
                {GLOSA_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </Select>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Ubi. Part" value={ubipart} isReadOnly />
                <Input label="Dir. Partida" value={dirPartida} isReadOnly />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Ubi. Dest" value={ubidest} isReadOnly />
                <Input label="Dir. Destino" value={dirDestino} isReadOnly />
              </div>
            </div>

            {/* Derecha */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Transporte" value={transporte?.empresa || transporte?.conductor || ''} isReadOnly />
                <Input label="Código Transporte" value={transporte?.id || ''} isReadOnly />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  color="danger"
                  variant="flat"
                  onPress={() => openModal('Datos del Transporte', 'transporte')}
                  startContent={<IoMdCar />}
                >
                  Transporte
                </Button>
                <Button
                  color="primary"
                  variant="flat"
                  onPress={() => openModal('Nuevo Cliente', 'cliente')}
                  startContent={<MdPersonAdd />}
                >
                  Cliente
                </Button>
                <Button
                  color="warning"
                  variant="flat"
                  onPress={openModalBuscarProducto}
                  startContent={<FaBarcode />}
                  // Eliminado isDisabled para permitir agregar sin sucursal
                >
                  Productos
                </Button>
              </div>
              <Textarea
                label="Observación"
                value={observacion}
                onChange={e => setObservacion(e.target.value)}
                minRows={3}
              />
              <Button
                color="success"
                onPress={openModalOpenGuardar}
                startContent={<FiSave />}
                isDisabled={!productosSeleccionados.length}
              >
                Guardar
              </Button>
            </div>
          </form>

            <Card className="dark:bg-zinc-800/60 border border-blue-100/50 dark:border-zinc-700/50 shadow-sm">
              <CardBody className="p-0">
                <ScrollShadow className="max-h-[340px]">
                  {/* Productos seleccionados en la guía */}
                  <NuevaTablaGuia
                    guias={productosSeleccionados}
                    setProductosSeleccionados={setProductosSeleccionados}
                  />
                </ScrollShadow>
              </CardBody>
            </Card>
        </CardBody>
      </Card>

      {/* Modal buscar producto */}
      <ModalBuscarProducto
        isOpen={isProductoModalOpen}
        onClose={closeModalBuscarProducto}
        productos={productos}
        agregarProducto={agregarProducto}
        loading={loadingProductos}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
      />

      {/* Confirmación */}
      <ConfirmationModal
        isOpen={isModalOpenGuardar}
        onClose={closeModalOpenGuardar}
        onConfirm={handleConfirmGuardar}
        title="Confirmación"
        message={confirmationMessage}
      />

      {/* Submodales */}
      {isModalOpen && modalType && (
        <>
          {modalType === 'ubicacion' && (
            <UbigeoForm
              modalTitle={modalTitle}
              onClose={closeModal}
              onSave={handleSaveUbigeo}
            />
          )}
            {modalType === 'transporte' && (
              <TransporteForm
                modalTitle={modalTitle}
                onClose={closeModal}
                onSave={handleSaveTransporte}
              />
            )}
            {modalType === 'cliente' && (
              <ClienteForm
                modalTitle={modalTitle}
                onClose={handleSaveCliente}
              />
            )}
        </>
      )}
    </div>
  );
}