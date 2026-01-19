import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import ModalBuscarProducto from '../components/modals/BuscarProductoForm';
import ProductosModal from '@/pages/Productos/ProductosForm';
import { Link } from 'react-router-dom';
import { FiSave, FiTrash2, FiPlus } from "react-icons/fi";
import { FaBoxOpen, FaArrowLeft, FaCheck } from "react-icons/fa6";
import { MdPersonAdd } from "react-icons/md";
import { useDestinatariosIngreso, useDocumentosIngreso, useAlmacenesIngreso } from '@/hooks/useNotaIngreso';
import { useDestinatariosSalida, useDocumentosSalida, useAlmacenesSalida } from '@/hooks/useNotaSalida';
import RegistroNotaTable from './components/RegistroNotaTable';
import AgregarProovedor from '../components/modals/AgregarProovedor';
import { getProductosIngreso, insertNotaIngreso } from '@/services/notaIngreso.services';
import { getProductosSalida, insertNotaSalida } from '@/services/notaSalida.services';
import { toast } from "react-hot-toast";
import ConfirmationModal from '@/components/Modals/ConfirmationModal';
import { Button, Input, Select, SelectItem, Textarea, Tabs, Tab, Chip, Divider } from "@heroui/react";
import { useUserStore } from "@/store/useStore";

const GLOSAS = {
    ingreso: [
        "COMPRA EN EL PAIS", "COMPRA EN EL EXTERIOR", "RESERVADO",
        "TRANSFERENCIA ENTRE ESTABLECIMIENTO<->CIA", "DEVOLUCION", "CLIENTE",
        "MERCAD DEVOLUCIÓN (PRUEBA)", "PROD.DESVOLUCIÓN (M.P.)",
        "ING. PRODUCCIÓN(P.T.)", "AJUSTE INVENTARIO", "OTROS INGRESOS",
        "DESARROLLO CONSUMO INTERNO", "INGRESO DIFERIDO", "CAMBIO DE PRENDA"
    ],
    salida: [
        "VENTA DE PRODUCTOS", "VENTA AL EXTERIOR", "CONSIGNACION CLIENTE",
        "TRASLADO ENTRE ALMACENES", "ITINERANTE", "CAMBIO MERCAD. PROV.",
        "MATERIA PRIMA PRODUCCION", "DEVOLUCION PROOVEDOR",
        "AJUSTE INVENTARIO", "OTRAS SALIDAS", "RESERVADO",
        "CONSUMO INTERNO", "EXTORNO DIFERIDO", "TRANSFORMACION"
    ]
};

const TIPO_NOTA = [
    { value: 'ingreso', label: 'Ingreso' },
    { value: 'salida', label: 'Salida' },
    { value: 'conjunto', label: 'Conjunto' }
];

// Soft Modern Styles
const glassCard = "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-slate-200 dark:border-white/5 shadow-sm rounded-2xl";
const inputClasses = {
    inputWrapper: "bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shadow-none rounded-xl",
    input: "font-medium text-slate-700 dark:text-slate-200",
    label: "text-slate-500 font-semibold mb-1"
};

const formatDate = (d = new Date()) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const nowDate = formatDate();

const useDebounce = (fn, delay = 350) => {
    const t = useRef();
    const fnRef = useRef(fn);
    fnRef.current = fn;
    return useCallback((...args) => {
        clearTimeout(t.current);
        t.current = setTimeout(() => fnRef.current(...args), delay);
    }, [delay]);
};

function RegistroNota() {
    // Modales
    const [isModalBuscar, setIsModalBuscar] = useState(false);
    const [isModalProducto, setIsModalProducto] = useState(false);
    const [isModalProveedor, setIsModalProveedor] = useState(false);
    const [isModalGuardar, setIsModalGuardar] = useState(false);
    const [modalTitle, setModalTitle] = useState('');

    // Form state
    const [tipoNota, setTipoNota] = useState('ingreso');

    // Hooks
    const { almacenes: almacenesIng } = useAlmacenesIngreso();
    const { almacenes: almacenesSal } = useAlmacenesSalida();
    const { destinatarios: destIng } = useDestinatariosIngreso();
    const { destinatarios: destSal } = useDestinatariosSalida();
    const { documentos: documentosIng } = useDocumentosIngreso();
    const { documentos: documentosSal } = useDocumentosSalida();

    const currentDocumentoIngreso = documentosIng[0]?.nuevo_numero_de_nota || documentosIng[0]?.nota || '';
    const currentDocumentoSalida = documentosSal[0]?.nuevo_numero_de_nota || documentosSal[0]?.nota || '';

    // Unified Data Sources
    const almacenes = tipoNota === 'salida' ? almacenesSal : almacenesIng;
    const destinatarios = tipoNota === 'salida' ? destSal : destIng;

    // Global User
    const sucursalSeleccionada = useUserStore(s => s.sur);
    const rolUsuario = useUserStore(s => s.rol);
    const usuario = useUserStore(s => s.nombre);

    // Form Fields
    const [almacenOrigen, setAlmacenOrigen] = useState('');
    const [almacenDestino, setAlmacenDestino] = useState('');
    const [destinatario, setDestinatario] = useState('');
    const [rucDest, setRucDest] = useState('');
    const [glosa, setGlosa] = useState('');
    const [nota, setNota] = useState('');
    const [fecha, setFecha] = useState(nowDate);
    const [observacion, setObservacion] = useState('');

    // Productos
    const [productos, setProductos] = useState([]);
    const [searchInput, setSearchInput] = useState('');
    const [codigoBarras, setCodigoBarras] = useState('');
    const [productosSeleccionados, setProductosSeleccionados] = useState([]);

    // Validaciones
    const isValid = useMemo(() => {
        if (!usuario) return false;
        if (!almacenDestino || !destinatario || !glosa || !fecha || !nota) return false;
        const needsIngreso = tipoNota === 'ingreso' || tipoNota === 'conjunto';
        const needsSalida = tipoNota === 'salida' || tipoNota === 'conjunto';
        if (needsIngreso && !currentDocumentoIngreso) return false;
        if (needsSalida && !currentDocumentoSalida) return false;
        if (!productosSeleccionados.length) return false;
        if (tipoNota === 'salida' || tipoNota === 'conjunto') {
            if (productosSeleccionados.some(p => p.cantidad > p.stock)) return false;
        }
        return true;
    }, [usuario, almacenDestino, destinatario, glosa, fecha, nota, tipoNota, currentDocumentoIngreso, currentDocumentoSalida, productosSeleccionados]);

    const [isSaving, setIsSaving] = useState(false);
    const [confirmationMessage, setConfirmationMessage] = useState('');

    // Filter Logic
    const almacenesOrigenFiltrados = useMemo(() => {
        if (rolUsuario === 1) return almacenes;
        if (tipoNota === 'salida') return almacenes.filter(a => a.sucursal === sucursalSeleccionada);
        return almacenes;
    }, [almacenes, rolUsuario, sucursalSeleccionada, tipoNota]);

    const almacenesDestinoFiltrados = useMemo(() => {
        if (rolUsuario === 1) return almacenes;
        if (tipoNota === 'ingreso') return almacenes.filter(a => a.sucursal === sucursalSeleccionada);
        return almacenes;
    }, [almacenes, rolUsuario, sucursalSeleccionada, tipoNota]);

    useEffect(() => {
        const sel = destinatarios.find(d => String(d.id) === String(destinatario));
        setRucDest(sel?.documento || '');
    }, [destinatario, destinatarios]);

    const debouncedBuscar = useDebounce(async (crit) => {
        if (!almacenOrigen && tipoNota !== 'ingreso') {
            setProductos([]);
            return;
        }
        try {
            let res;
            if (tipoNota === 'salida' || tipoNota === 'conjunto') {
                res = await getProductosSalida(crit);
            } else {
                res = await getProductosIngreso(crit);
            }
            setProductos(res?.data || []);
        } catch {
            setProductos([]);
        }
    }, 400);

    useEffect(() => {
        if (isModalBuscar && (almacenOrigen || tipoNota === 'ingreso')) {
            debouncedBuscar({ descripcion: searchInput, almacen: almacenOrigen, cod_barras: codigoBarras });
        }
    }, [searchInput, codigoBarras, almacenOrigen, isModalBuscar, debouncedBuscar, tipoNota]);

    useEffect(() => {
        const h = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (isValid) openModalGuardar();
            }
        };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [isValid]);

    useEffect(() => {
        setProductosSeleccionados([]);
        setDescripcionNotaPlaceholder();
    }, [tipoNota]);

    const setDescripcionNotaPlaceholder = () => {
        if (tipoNota === 'salida') setNota('Salida de mercadería');
        else if (tipoNota === 'ingreso') setNota('Ingreso de mercadería');
        else setNota('Movimiento conjunto');
    };

    const openModalBuscarProducto = useCallback(() => {
        if (!almacenOrigen && tipoNota !== 'ingreso') {
            toast.error('Seleccione un almacén origen primero');
            return;
        }
        setIsModalBuscar(true);
    }, [almacenOrigen, tipoNota]);

    const closeModalBuscarProducto = () => setIsModalBuscar(false);
    const openModalProveedor = () => setIsModalProveedor(true);
    const closeModalProveedor = () => setIsModalProveedor(false);

    const openModalGuardar = () => {
        setConfirmationMessage(`¿Confirmar registro de ${tipoNota.toUpperCase()}?`);
        setIsModalGuardar(true);
    };
    const closeModalGuardar = () => setIsModalGuardar(false);

    const agregarProducto = useCallback((producto, cantidad) => {
        setProductosSeleccionados(prev => {
            if ((tipoNota === 'salida' || tipoNota === 'conjunto')) {
                const agregadoPrev = prev
                    .filter(p => p.codigo === producto.codigo)
                    .reduce((a, p) => a + p.cantidad, 0);
                const nuevoTotal = agregadoPrev + cantidad;
                const stockDisponible = producto.stock || 0;
                if (nuevoTotal > stockDisponible) {
                    toast.error(`Stock insuficiente. Disponible: ${stockDisponible}`);
                    return prev;
                }
            }
            const existe = prev.find(p => p.codigo === producto.codigo);
            if (existe) {
                return prev.map(p => (p.codigo === producto.codigo ? { ...p, cantidad: p.cantidad + cantidad } : p));
            } else {
                return [...prev, { ...producto, cantidad }];
            }
        });
        closeModalBuscarProducto();
    }, [tipoNota]);

    const handleCancel = () => setProductosSeleccionados([]);

    const buildFechaCompleta = () => {
        const d = new Date();
        const tz = d.getTimezoneOffset() * 60000;
        const fPart = fecha.split('-');
        const now = new Date();
        const finalDate = new Date(fPart[0], fPart[1] - 1, fPart[2], now.getHours(), now.getMinutes(), now.getSeconds());
        return new Date(finalDate.getTime() - tz).toISOString().slice(0, 19).replace('T', ' ');
    };

    const handleGuardar = async () => {
        if (!isValid) {
            toast.error('Complete los campos requeridos.');
            return;
        }
        setIsSaving(true);
        const fechaISO = buildFechaCompleta();

        const makePayload = (isOutput) => ({
            almacenO: almacenOrigen,
            almacenD: almacenDestino,
            destinatario,
            glosa,
            nota,
            fecha: fechaISO,
            producto: productosSeleccionados.map(p => p.codigo || p.id),
            numComprobante: isOutput ? currentDocumentoSalida : currentDocumentoIngreso,
            cantidad: productosSeleccionados.map(p => p.cantidad),
            observacion,
            ...(isOutput ? { nom_usuario: usuario } : { usuario })
        });

        try {
            let resIng = { success: false };
            let resSal = { success: false };

            if (tipoNota === 'conjunto') {
                const [r1, r2] = await Promise.all([insertNotaIngreso(makePayload(false)), insertNotaSalida(makePayload(true))]);
                resIng = r1; resSal = r2;
            } else if (tipoNota === 'ingreso') {
                resIng = await insertNotaIngreso(makePayload(false));
            } else {
                resSal = await insertNotaSalida(makePayload(true));
            }

            const ok = (tipoNota === 'ingreso' && resIng.success)
                || (tipoNota === 'salida' && resSal.success)
                || (tipoNota === 'conjunto' && resIng.success && resSal.success);

            if (ok) {
                toast.success('Nota registrada exitosamente.');
                handleCancel();
                window.history.back();
            } else {
                toast.error('Error al registrar la nota.');
            }
        } catch (e) {
            console.error(e);
            toast.error('Error del servidor: ' + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleConfirmGuardar = async () => {
        closeModalGuardar();
        await handleGuardar();
    };

    const totalItems = productosSeleccionados.length;

    return (
        <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#09090b] p-6 lg:p-10 font-inter tracking-tight">

            <div className="max-w-[1600px] mx-auto space-y-6">
                {/* Top Navigation */}
                <div className="flex items-center justify-between">
                    <Link to="/nota_almacen" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
                        <div className="h-8 w-8 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm border border-slate-200 dark:border-zinc-700">
                            <FaArrowLeft size={12} />
                        </div>
                        <span className="text-sm font-semibold">Volver al Inventario</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
                            {formatDate()}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                    {/* Left Panel: Configuration */}
                    <div className="xl:col-span-4 space-y-6">
                        <div className="bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 shadow-sm rounded-2xl p-6 space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-1">Nueva Nota</h2>
                                <p className="text-sm text-slate-500">Configure los detalles del movimiento.</p>
                            </div>

                            <Tabs
                                aria-label="Tipo Nota"
                                selectedKey={tipoNota}
                                onSelectionChange={setTipoNota}
                                classNames={{
                                    base: "w-full",
                                    tabList: "w-full bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl",
                                    cursor: "bg-white dark:bg-zinc-700 shadow-sm rounded-lg",
                                    tab: "h-9 font-semibold text-slate-500 dark:text-slate-400 data-[selected=true]:text-slate-900 dark:data-[selected=true]:text-white"
                                }}
                            >
                                {TIPO_NOTA.map(t => (
                                    <Tab key={t.value} title={t.label} isDisabled={(t.value === "conjunto") && rolUsuario !== 1} />
                                ))}
                            </Tabs>

                            <div className="grid grid-cols-1 gap-4">
                                <Select label="Almacén Origen" placeholder="Seleccionar..." selectedKeys={almacenOrigen ? [String(almacenOrigen)] : []} isDisabled={productosSeleccionados.length > 0} onChange={(e) => setAlmacenOrigen(e.target.value)} variant="bordered" classNames={inputClasses}>
                                    {almacenesOrigenFiltrados.map(a => <SelectItem key={a.id} value={a.id}>{a.almacen}</SelectItem>)}
                                </Select>

                                <Select label="Almacén Destino" placeholder="Seleccionar..." selectedKeys={almacenDestino ? [String(almacenDestino)] : []} onChange={(e) => setAlmacenDestino(e.target.value)} variant="bordered" classNames={inputClasses}>
                                    {almacenesDestinoFiltrados.map(a => <SelectItem key={a.id} value={a.id}>{a.almacen}</SelectItem>)}
                                </Select>

                                <Divider className="my-2" />

                                <Select label={tipoNota === 'ingreso' ? "Proveedor" : "Destinatario"} placeholder="Seleccionar..." selectedKeys={destinatario ? [String(destinatario)] : []} onChange={(e) => setDestinatario(e.target.value)} variant="bordered" classNames={inputClasses}>
                                    {destinatarios.map(d => <SelectItem key={d.id} value={d.id}>{d.destinatario || d.nombre_proveedor}</SelectItem>)}
                                </Select>

                                <Select label="Motivo (Glosa)" placeholder="Seleccionar..." selectedKeys={glosa ? [glosa] : []} onChange={e => setGlosa(e.target.value)} variant="bordered" classNames={inputClasses}>
                                    {(GLOSAS[tipoNota] || GLOSAS['ingreso']).map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                                </Select>

                                <Input
                                    type="date"
                                    label="Fecha de Emisión"
                                    placeholder="Seleccione fecha"
                                    value={fecha}
                                    onChange={(e) => setFecha(e.target.value)}
                                    variant="bordered"
                                    classNames={inputClasses}
                                />

                                <Input label="Referencia / Nota" placeholder="Ej. Ingreso por compra..." value={nota} onChange={e => setNota(e.target.value)} variant="bordered" classNames={inputClasses} />
                                <Textarea label="Observaciones" placeholder="Opcional..." minRows={2} value={observacion} onChange={e => setObservacion(e.target.value)} variant="bordered" classNames={inputClasses} />
                            </div>

                            <Button
                                className="w-full font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white shadow-sm"
                                startContent={<MdPersonAdd size={18} />}
                                onPress={openModalProveedor}
                            >
                                Crear Nuevo {tipoNota === 'ingreso' ? "Proveedor" : "Destinatario"}
                            </Button>
                        </div>
                    </div>

                    {/* Right Panel: Items & Actions */}
                    <div className="xl:col-span-8 space-y-6">
                        {/* Summary Bar */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-inner">
                                    <FaBoxOpen size={22} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">DOCUMENTO</span>
                                    <div className="font-mono text-xl font-bold text-slate-800 dark:text-white tracking-tight">
                                        {tipoNota === 'ingreso' ? currentDocumentoIngreso : tipoNota === 'salida' ? currentDocumentoSalida : `${currentDocumentoIngreso.slice(-4)} / ${currentDocumentoSalida.slice(-4)}`}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Chip size="lg" variant="flat" classNames={{ base: "bg-slate-100 dark:bg-zinc-800 h-10 px-3", content: "font-bold text-slate-600 dark:text-slate-300" }}>
                                    {totalItems} Items
                                </Chip>
                                <Button
                                    color="primary"
                                    className="font-bold shadow-lg shadow-blue-500/20 bg-blue-600 text-white h-10 px-6"
                                    startContent={<FiPlus size={20} />}
                                    onPress={openModalBuscarProducto}
                                    isDisabled={!almacenOrigen && tipoNota !== 'ingreso'}
                                >
                                    Añadir Productos
                                </Button>
                            </div>
                        </div>

                        {/* Items Table Card */}
                        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm rounded-2xl overflow-hidden min-h-[500px] flex flex-col">
                            <div className="py-4 px-6 border-b border-slate-100 dark:border-zinc-800">
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">DETALLE DE ITEMS</h3>
                            </div>
                            <div className="flex-1 p-0">
                                <RegistroNotaTable productos={productosSeleccionados} setProductosSeleccionados={setProductosSeleccionados} />
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex justify-end gap-4 pt-2">
                            <Button
                                variant="light"
                                color="danger"
                                onPress={handleCancel}
                                startContent={<FiTrash2 />}
                                className="font-bold"
                            >
                                Limpiar
                            </Button>
                            <Button
                                className="font-bold text-white bg-slate-900 hover:bg-black dark:bg-slate-700 dark:hover:bg-slate-600 w-48 shadow-lg h-11"
                                startContent={<FiSave />}
                                onPress={openModalGuardar}
                                isDisabled={!isValid || isSaving}
                                isLoading={isSaving}
                            >
                                Guardar Nota
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Modales */}
                <ModalBuscarProducto
                    isOpen={isModalBuscar}
                    onClose={closeModalBuscarProducto}
                    onBuscar={() => debouncedBuscar({ descripcion: searchInput, almacen: almacenOrigen, cod_barras: codigoBarras })}
                    setSearchInput={setSearchInput}
                    productos={productos}
                    agregarProducto={agregarProducto}
                    setCodigoBarras={setCodigoBarras}
                    hideStock={!almacenOrigen && tipoNota !== 'ingreso'}
                />
                {isModalProducto && (<ProductosModal modalTitle={modalTitle} onClose={() => setIsModalProducto(false)} />)}
                <AgregarProovedor isOpen={isModalProveedor} onClose={closeModalProveedor} titulo={tipoNota === 'ingreso' ? "proveedor" : "destinatario"} />
                {isModalGuardar && (<ConfirmationModal message={confirmationMessage} onClose={closeModalGuardar} isOpen={isModalGuardar} onConfirm={handleConfirmGuardar} />)}
            </div>
        </div>
    );
}

export default RegistroNota;
