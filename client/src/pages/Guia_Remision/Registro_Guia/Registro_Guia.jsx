import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { IoMdPin, IoMdCar } from 'react-icons/io';
import { MdPersonAdd, MdSave, MdArrowBack } from "react-icons/md";
import { FaBarcode, FaBoxOpen, FaTruck, FaMapMarkerAlt, FaFileAlt } from "react-icons/fa";
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import ModalBuscarProducto from './ComponentsRegGuias/BuscarProdGuiaForm';
import NuevaTablaGuia from './ComponentsRegGuias/NuevaGuiaTable';
import UbigeoForm from './UbigeoForm';
import TransporteForm from './UndTrans';
import ClienteForm from './ClienteForm';

import {
  getDestinatariosGuia,
  getSucursalesGuia,
  generarDocumentoGuia,
  insertGuiaRemisionAndDetalle,
  handleGuiaRemisionSunat,
  buscarProductosGuia
} from '@/services/guiaRemision.services';
import ConfirmationModal from '@/components/Modals/ConfirmationModal';

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

const formatDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function RegistroGuia() {
  const navigate = useNavigate();
  // Datos externos
  const [clientes, setClientes] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const nombreUsuario = useUserStore.getState().nombre;
  const lastTermRef = useRef('');
  const loadingRef = useRef(false);

  // Cargar datos iniciales
  useEffect(() => {
    const fetchInitialData = async () => {
      const [clientesRes, sucursalesRes, documentoRes] = await Promise.all([
        getDestinatariosGuia(),
        getSucursalesGuia(),
        generarDocumentoGuia()
      ]);

      if (clientesRes.success) setClientes(clientesRes.data);
      if (sucursalesRes.success) setSucursales(sucursalesRes.data);
      if (documentoRes.success) {
        // Ensure we handle both array and object responses for robustness
        const docs = Array.isArray(documentoRes.data) ? documentoRes.data : [documentoRes.data];
        setDocumentos(docs);
      }
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

  // Handle potential property names: 'nuevo_numero_de_guia' (from controller) or 'guia' (legacy/fallback)
  const currentDocumento = documentos.length
    ? (documentos[0].nuevo_numero_de_guia || documentos[0].guia || '')
    : '';
  const [currentHour, setCurrentHour] = useState(new Date().toLocaleTimeString('en-GB', { hour12: false }));
  const [todayString] = useState(formatDate(new Date()));

  // Modales
  const [modalType, setModalType] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProductoModalOpen, setIsProductoModalOpen] = useState(false);
  const [isModalOpenGuardar, setIsModalOpenGuardar] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');

  // Clock
  useEffect(() => {
    const int = setInterval(() => setCurrentHour(new Date().toLocaleTimeString('en-GB', { hour12: false })), 1000);
    return () => clearInterval(int);
  }, []);

  // Update Cliente
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

  // Update Sucursal
  useEffect(() => {
    if (selectedSucursalId) {
      const suc = sucursales.find(s => String(s.id) === String(selectedSucursalId));
      setDirPartida(suc?.direccion || '');
    } else {
      setDirPartida('');
    }
  }, [selectedSucursalId, sucursales]);

  // Sucursales Unicas (Deduplicated by name)
  const sucursalesUnicas = useMemo(() => {
    const seen = new Set();
    return (sucursales || []).filter(s => {
      if (!s || seen.has(s.nombre)) return false;
      seen.add(s.nombre);
      return true;
    });
  }, [sucursales]);

  // Handle Products Search
  const loadProductos = useCallback(async (term = '') => {
    const normalizado = term.trim();
    if (loadingRef.current) return;
    if (normalizado === lastTermRef.current && productos.length) return;
    lastTermRef.current = normalizado;
    loadingRef.current = true;
    setLoadingProductos(true);
    try {
      await buscarProductosGuia(normalizado, setProductos);
    } catch (e) {
      console.error('Fallo carga productos:', e?.message);
    } finally {
      setLoadingProductos(false);
      loadingRef.current = false;
    }
  }, [productos.length]);

  useEffect(() => {
    if (isProductoModalOpen) loadProductos(searchInput);
  }, [isProductoModalOpen, searchInput, loadProductos]);

  const openModalBuscarProducto = () => {
    setIsProductoModalOpen(true);
    if (!productos.length) loadProductos('');
  };

  const closeModalBuscarProducto = () => setIsProductoModalOpen(false);

  // Generic Modal Logic
  const openModal = (title, type) => {
    setModalTitle(title);
    setModalType(type);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setModalType('');
  };

  const closeModalOpenGuardar = () => setIsModalOpenGuardar(false);

  const handleSaveUbigeo = (uPart, uDest) => {
    setUbipart(uPart);
    setUbidest(uDest);
    closeModal();
  };
  const handleSaveTransporte = (data) => {
    setTransporte(data);
    closeModal();
  };
  const handleSaveCliente = () => closeModal();

  // Add Product Logic
  const agregarProducto = useCallback((producto, cantidad, variant = null) => {
    setProductosSeleccionados(prev => {
      const uniqueKey = variant
        ? (variant.id_sku ? `SKU-${variant.id_sku}` : `${producto.codigo}-${variant.id_tonalidad || 'null'}-${variant.id_talla || 'null'}`)
        : `${producto.codigo}-null-null`;

      // Check stock with variant logic
      const stockDisponible = variant ? variant.stock : producto.stock;

      const totalPrev = prev
        .filter(p => p.uniqueKey === uniqueKey)
        .reduce((acc, p) => acc + p.cantidad, 0);

      const nuevoTotal = totalPrev + cantidad;

      // Validar stock SOLO si hay sucursal seleccionada
      if (selectedSucursalId && nuevoTotal > stockDisponible) {
        toast.error(`Stock insuficiente. Máximo: ${stockDisponible}`);
        return prev;
      }

      const existente = prev.find(p => p.uniqueKey === uniqueKey);

      const productData = {
        ...producto,
        cantidad,
        id_tonalidad: variant?.id_tonalidad || null,
        id_talla: variant?.id_talla || null,
        id_sku: variant?.id_sku || null, // Added SKU
        attributes: variant?.attributes || null,
        resolvedAttributes: variant?.resolvedAttributes || null,
        nombre_tonalidad: variant?.tonalidad || variant?.nombre_tonalidad || null,
        nombre_talla: variant?.talla || variant?.nombre_talla || null,
        sku_label: variant?.sku_label || variant?.nombre_sku || null, // Added Label
        stock_disponible: Number(stockDisponible) || 0,
        uniqueKey
      };

      if (existente) {
        return prev.map(p => p.uniqueKey === uniqueKey ? { ...p, cantidad: p.cantidad + cantidad } : p);
      }
      return [...prev, productData];
    });
    closeModalBuscarProducto();
  }, []);

  const handleCancel = () => setProductosSeleccionados([]);

  // Validation
  const validateBeforeSave = () => {
    const errors = [];
    if (!selectedSucursalId) errors.push('Seleccione una sucursal');
    if (!selectedClienteId) errors.push('Seleccione un cliente');
    if (!glosa) errors.push('Seleccione una glosa');
    if (!currentDocumento) errors.push('Documento no disponible');
    if (!productosSeleccionados.length) errors.push('Agregue productos');
    if (!ubipart) errors.push('Ubigeo de partida requerido');
    if (!ubidest) errors.push('Ubigeo de destino requerido');

    if (errors.length) {
      errors.forEach(e => toast.error(e));
      return false;
    }
    return true;
  };

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
    tonalidad: productosSeleccionados.map(p => p.id_tonalidad || null),
    talla: productosSeleccionados.map(p => p.id_talla || null),
    sku: productosSeleccionados.map(p => p.id_sku || null), // Added SKU array
  }), [
    selectedSucursalId, ubipart, ubidest, selectedClienteId, transporte,
    glosa, dirPartida, dirDestino, canti, peso, observacion,
    todayString, currentHour, productosSeleccionados, currentDocumento
  ]);

  const handleGuardar = async () => {
    if (!validateBeforeSave()) return;
    try {
      const resp = await insertGuiaRemisionAndDetalle(guiaData);
      if (!resp.success) {
        toast.error(resp.message || 'Error al guardar');
        return;
      }
      toast.success('Guía guardada exitosamente');
      // Sync Sunat logic
      const destinatarioPayload = { documento: documentoCliente, destinatario: selectedCliente?.nombre || '' };
      const transportistaPayload = { placa: transporte?.placa || '' };

      const sunatResp = await handleGuiaRemisionSunat(guiaData, destinatarioPayload, transportistaPayload, productosSeleccionados, nombreUsuario);

      if (sunatResp && sunatResp.success) {
        toast.success('Guía enviada a SUNAT correctamente');
      } else {
        toast('Guía guardada, pero error envío SUNAT: ' + (sunatResp?.message || 'Error desconocido'), { icon: '⚠️' });
      }

      handleCancel();
      navigate('/almacen/guia_remision');
    } catch (e) {
      toast.error('Error inesperado');
    }
  };

  const openModalOpenGuardar = () => {
    setConfirmationMessage('¿Confirmar registro de guía?');
    setIsModalOpenGuardar(true);
  };
  const handleConfirmGuardar = async () => {
    setIsModalOpenGuardar(false);
    await handleGuardar();
  };

  // Styles
  const cardClasses = "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm rounded-xl h-full";
  const headerClasses = "pb-0 pt-4 px-4 flex gap-3 items-center text-slate-700 dark:text-slate-200 font-bold text-lg";
  const iconBoxClasses = "p-2 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400";

  return (
    <div className="min-h-screen bg-[#F3F4F6] dark:bg-[#09090b] p-6 font-inter">

      {/* Top Bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button isIconOnly variant="light" onPress={() => navigate(-1)} className="text-slate-500 hover:text-indigo-600">
            <MdArrowBack size={24} />
          </Button>
          <div>
            <h1 className="text-2xl font-extrabold text-[#1e293b] dark:text-white tracking-tight">Registro de Guía</h1>
            <div className="flex items-center gap-2 mt-1">
              <Chip size="sm" variant="flat" color="primary" className="font-mono font-bold">{currentDocumento || 'Cargando...'}</Chip>
              <span className="text-xs text-slate-500 font-medium">{todayString} • {currentHour}</span>
            </div>
          </div>
        </div>
        <Button
          color="success"
          variant="shadow"
          className="font-bold text-white"
          startContent={<MdSave size={20} />}
          onPress={openModalOpenGuardar}
          isDisabled={productosSeleccionados.length === 0}
        >
          Guardar Guía
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Card 1: Datos Generales */}
        <Card className={cardClasses}>
          <CardHeader className={headerClasses}>
            <div className={iconBoxClasses}><FaFileAlt /></div>
            Datos Generales
          </CardHeader>
          <Divider className="my-2" />
          <CardBody className="gap-4 px-4 pb-4">
            <Select
              label="Sucursal Origen"
              placeholder="Selecciona sucursal"
              selectedKeys={selectedSucursalId ? [selectedSucursalId] : []}
              onChange={(e) => setSelectedSucursalId(e.target.value)}
              variant="flat"
              itemClasses={{ base: "text-slate-900 dark:text-slate-200" }}
              popoverProps={{ classNames: { content: "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800" } }}
            >
              {sucursalesUnicas.map(s => <SelectItem key={s.id} value={s.id} className="text-slate-700 dark:text-slate-200">{s.nombre}</SelectItem>)}
            </Select>
            <div className="flex gap-2">
              <Select
                label="Cliente (Destinatario)"
                placeholder="Selecciona cliente"
                selectedKeys={selectedClienteId ? [selectedClienteId] : []}
                onChange={(e) => setSelectedClienteId(e.target.value)}
                className="flex-1"
                variant="flat"
                itemClasses={{ base: "text-slate-900 dark:text-slate-200" }}
                popoverProps={{ classNames: { content: "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800" } }}
              >
                {clientes.map(c => <SelectItem key={c.id} value={c.id} className="text-slate-700 dark:text-slate-200">
                  {c.destinatario || c.nombre || "Cliente sin nombre"}
                </SelectItem>)}
              </Select>
              <Button isIconOnly variant="flat" color="primary" className="h-[56px] w-[56px]" onPress={() => openModal('Nuevo Cliente', 'cliente')}><MdPersonAdd size={20} /></Button>
            </div>
            <Input label="Documento Identidad" value={documentoCliente} isReadOnly variant="flat" className="bg-slate-50" />

            <Select
              label="Motivo de Traslado (Glosa)"
              placeholder="Selecciona motivo"
              selectedKeys={glosa ? [glosa] : []}
              onChange={(e) => setGlosa(e.target.value)}
              variant="flat"
              itemClasses={{ base: "text-slate-900 dark:text-slate-200" }}
              popoverProps={{ classNames: { content: "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800" } }}
            >
              {GLOSA_OPTIONS.map(o => <SelectItem key={o} value={o} className="text-slate-700 dark:text-slate-200">{o}</SelectItem>)}
            </Select>
            <Textarea label="Observaciones" placeholder="Detalles adicionales..." minRows={2} value={observacion} onChange={e => setObservacion(e.target.value)} variant="flat" />
          </CardBody>
        </Card>

        {/* Card 2: Traslado y Transporte */}
        <Card className={cardClasses}>
          <CardHeader className={headerClasses}>
            <div className={iconBoxClasses}><FaTruck /></div>
            Traslado y Transporte
          </CardHeader>
          <Divider className="my-2" />
          <CardBody className="gap-4 px-4 pb-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Cant. Bultos" type="number" value={canti} onChange={e => setCanti(e.target.value)} variant="flat" />
              <Input label="Peso Total (Kg)" type="number" value={peso} onChange={e => setPeso(e.target.value)} variant="flat" />
            </div>

            <div className="p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-slate-300 dark:border-zinc-700">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Ubicación (Ubigeo)</span>
                <Button size="sm" color="warning" variant="flat" onPress={() => openModal('Ubicación (Ubigeo)', 'ubicacion')} startContent={<FaMapMarkerAlt />}>Definir</Button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="block text-slate-400">Partida:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{ubipart || '-'}</span>
                </div>
                <div>
                  <span className="block text-slate-400">Destino:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{ubidest || '-'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Input label="Dirección Partida" value={dirPartida} isReadOnly variant="flat" description="Automático según sucursal" />
              <Input label="Dirección Destino" value={dirDestino} isReadOnly variant="flat" description="Automático según cliente" />
            </div>

            <div className="p-3 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-800/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-indigo-500 uppercase">Transportista</span>
                <Button size="sm" color="primary" variant="flat" onPress={() => openModal('Datos Transporte', 'transporte')} startContent={<IoMdCar />}>Seleccionar</Button>
              </div>
              {transporte ? (
                <div className="text-xs space-y-1">
                  <p className="font-bold text-slate-700">{transporte.empresa || transporte.conductor}</p>
                  <p className="text-slate-500">Placa: {transporte.placa}</p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No seleccionado</p>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Card 3: Contenido - Full Height on Desktop if needed, or structured grid */}
        <Card className={`${cardClasses} xl:col-span-1`}>
          <CardHeader className={`${headerClasses} justify-between`}>
            <div className="flex gap-3 items-center">
              <div className={iconBoxClasses}><FaBoxOpen /></div>
              Contenido
            </div>
            <Button size="sm" color="primary" variant="solid" onPress={openModalBuscarProducto} startContent={<FaBarcode />}>
              Agregar
            </Button>
          </CardHeader>
          <Divider className="my-2" />
          <CardBody className="px-0 pb-0">
            <ScrollShadow className="h-[400px] xl:h-[500px] w-full">
              <NuevaTablaGuia
                guias={productosSeleccionados}
                setProductosSeleccionados={setProductosSeleccionados}
              />
            </ScrollShadow>
            {/* Footer Resumen */}
            <div className="p-4 bg-slate-50 border-t border-slate-200">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-slate-600">Total Items:</span>
                <span className="font-extrabold text-indigo-600 text-lg">{productosSeleccionados.reduce((acc, p) => acc + p.cantidad, 0)}</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Submodales */}
      <ModalBuscarProducto
        isOpen={isProductoModalOpen}
        onClose={closeModalBuscarProducto}
        productos={productos}
        agregarProducto={agregarProducto}
        loading={loadingProductos}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        hideStock={!selectedSucursalId}
        almacenOrigen={selectedSucursalId}
        mode={selectedSucursalId ? 'salida' : 'ingreso'}
      />

      <ConfirmationModal
        isOpen={isModalOpenGuardar}
        onClose={closeModalOpenGuardar}
        onConfirm={handleConfirmGuardar}
        title="Confirmación"
        message={confirmationMessage}
      />

      {isModalOpen && modalType && (
        <>
          {modalType === 'ubicacion' && <UbigeoForm modalTitle={modalTitle} onClose={closeModal} onSave={handleSaveUbigeo} />}
          {modalType === 'transporte' && <TransporteForm modalTitle={modalTitle} onClose={closeModal} onSave={handleSaveTransporte} />}
          {modalType === 'cliente' && <ClienteForm modalTitle={modalTitle} onClose={handleSaveCliente} />}
        </>
      )}

    </div>
  );
}