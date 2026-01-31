import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import axios from "@/api/axios";

import { getEmpresaDataByUser } from "@/services/empresa.services";
import { useUserStore } from "@/store/useStore";
import { useVentaSeleccionadaStore } from "@/store/useVentaTable";
import {
    addClienteRequest,
    addVentaRequest,
    getVentaByIdRequest,
    getClienteVentasRequest,
    getComprobanteRequest,
    getProductosVentasRequest,
    getSucursalRequest,
    getVentasRequest,
    deleteVentaRequest,
    getNumeroComprobanteRequest,
    getLastVentaRequest,
    updateVentaEstadoRequest,
    getVentasOnlineRequest
} from "@/api/api.ventas";
import { getClientesExternosRequest } from "@/api/api.cliente"; // Importar request de clientes externos
import { getLibroVentasSunat } from "@/services/reporte.services";

// --- Helpers ---
const convertDateToDesiredFormat = (isoString, timeZoneOffset) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    date.setHours(date.getHours() + timeZoneOffset);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// --- handleGuardarCliente ---
export const handleGuardarCliente = async (clienteData) => {
    try {
        const response = await addClienteRequest(clienteData);
        if (response.data.code === 1) {
            return { success: true, data: response.data.data };
        } else {
            return { success: false, message: response.data.message };
        }
    } catch (error) {
        console.error('Error al guardar cliente:', error);
        return { success: false, message: error.message };
    }
};

// --- handleSunat (handle_sunat.js) ---
export const handleSunat = async (datosVenta, details = [], showSuccessToast = true) => {
    try {
        const response = await axios.post('/facturacion/send', {
            ...datosVenta,
            detalles: details.length > 0 ? details : datosVenta.detalles
        });
        if (response.data.success) {
            if (showSuccessToast) toast.success("Enviado a SUNAT exitosamente");
            return true;
        } else {
            toast.error("Error al enviar a SUNAT");
            return false;
        }
    } catch (error) {
        console.error('Error enviando a SUNAT:', error);
        toast.error("Error de conexión con servicio SUNAT");
        return false;
    }
};

export const handleSunatMultiple = async (ventas) => {
    // Implementación simplificada para envío masivo
    for (const venta of ventas) {
        await handleSunat(venta);
    }
};

export const handleSunatUnique = async (venta, showSuccessToast = true) => {
    return await handleSunat(venta, [], showSuccessToast);
};

// --- handleUpdate (update_venta.js) ---
export const handleUpdate = async (id, data) => {
    try {
        await updateVentaEstadoRequest({ id_venta: id, ...data });
    } catch (e) { console.error(e); }
};

// --- handleCobrar (handle_cobrar.js) ---
export const handleCobrar = async (datosVenta, callback, datosVentaSunat, uselessParam, nombreUsuario) => {
    try {
        // 1. Registrar Venta en BD
        const response = await addVentaRequest(datosVenta);

        if (response.data.code === 1) {
            // 2. Éxito BD -> Intentar SUNAT (Si corresponde)
            let sunatSuccess = false;
            let sunatAttempt = false;

            if (datosVentaSunat && (datosVenta.tipoComprobante === 'Boleta' || datosVenta.tipoComprobante === 'Factura')) {
                sunatAttempt = true;
                // Intentamos SUNAT silenciando su toast de éxito interno
                sunatSuccess = await handleSunatUnique(datosVentaSunat, false).catch(err => console.error("Error silencioso SUNAT:", err));
            }

            if (sunatAttempt) {
                if (sunatSuccess) {
                    toast.success("Venta registrada y enviada a SUNAT 🚀");
                } else {
                    toast("Venta registrada, pero falló envío a SUNAT ⚠️", { icon: '⚠️' });
                }
            } else {
                toast.success("Venta registrada exitosamente");
            }

            if (callback) callback();
            return true;
        } else {
            toast.error(response.data.message || "Error al registrar venta");
            return false;
        }
    } catch (error) {
        console.error("Error en handleCobrar:", error);
        toast.error("Error de conexión al registrar venta");
        return false;
    }
};

// --- anularVentaEnSunat - Frontend ---
export const anularVentaEnSunatF = async (id) => {
    try {
        // Implementación placeholder si no estaba definida previamente
        console.log("Anulando venta en SUNAT (Frontend flow)", id);
    } catch (e) { console.error(e); }
};

// --- anularVentaEnSunat - Backend ---
export const anularVentaEnSunatB = async (id) => {
    try {
        const response = await axios.post(`/facturacion/void/${id}`);
        return response.data;
    } catch (e) { console.error(e); }
};

// --- useBoucher (data_boucher_venta.js) ---
export const useBoucher = () => {
    // Hook placeholder simple si no se usa lógica compleja
    const [boucher, setBoucher] = useState(null);
    return { boucher, setBoucher };
};

export const validateDecimalInput = (value) => {
    const regex = /^\d*\.?\d*$/;
    return regex.test(value);
};

// --- useClientesData (data_cliente_venta.js) ---
export const useClientesData = () => {
    const [clientes, setClientes] = useState([]);

    useEffect(() => {
        const fetchClientes = async () => {
            try {
                // Fetch both local and external clients in parallel
                const [localRes, externalRes] = await Promise.all([
                    getClienteVentasRequest(),
                    getClientesExternosRequest()
                ]);

                let combinedClientes = [];

                // Process Local Clients
                if (localRes.data.code === 1) {
                    const localClientes = localRes.data.data.map(item => ({
                        id: item.id,
                        nombre: item.cliente_t,
                        documento: item.documento_t,
                        direccion: item.direccion_t,
                        origen: 'local'
                    }));
                    combinedClientes = [...localClientes];
                } else {
                    console.error('Error en solicitud clientes locales: ', localRes.data.message);
                }

                // Process External Clients
                if (externalRes.data.code === 1) {
                    const externalClientes = externalRes.data.data.map(item => ({
                        id: `EXT-${item.id_cliente}`, // Prefix ID to avoid collision
                        original_id: item.id_cliente,
                        nombre: item.razon_social || `${item.nombres} ${item.apellidos}`.trim(),
                        documento: item.ruc || item.dni,
                        direccion: item.direccion,
                        origen: 'externo'
                    }));
                    combinedClientes = [...combinedClientes, ...externalClientes];
                } else {
                    console.error('Error en solicitud clientes externos: ', externalRes.data.message);
                }

                setClientes(combinedClientes);

            } catch (error) {
                console.error('Error al obtener clientes:', error.message);
            }
        };

        fetchClientes();
    }, []);

    const addCliente = (nuevoDetalle) => setClientes([...clientes, nuevoDetalle]);
    const updateCliente = (updatedCliente) => setClientes(prev => prev.map(c => c.id === updatedCliente.id ? updatedCliente : c));
    const removeCliente = (id) => setClientes(clientes.filter(c => c.id !== id));

    return { clientes, setClientes, updateCliente, removeCliente, addCliente };
};

// --- useComprobanteData (data_comprobante_venta.js) ---
export const useComprobanteData = () => {
    const [comprobantes, setComprobante] = useState([]);

    useEffect(() => {
        const fetchComprobantes = async () => {
            try {
                const response = await getComprobanteRequest();
                if (response.data.code === 1) {
                    const comprobantes = response.data.data.map(item => ({
                        id: item.id,
                        nombre: item.nombre,
                    }));
                    setComprobante(comprobantes);
                } else {
                    console.error('Error en la solicitud: ', response.data.message);
                }
            } catch (error) {
                console.error('Error en la solicitud: ', error.message);
            }
        };
        fetchComprobantes();
    }, []);

    return { comprobantes, setComprobante };
};

// --- handleSunatPDF (Generación de PDF local) ---
const generarPDF = async (data, nombre) => {
    try {
        // Usar nuevo endpoint del backend para generar PDF
        const response = await axios.post('/sunat/cpe/invoice/pdf', data, {
            responseType: 'blob'
        });

        const serie = data?.serie || 'B001';
        const correlativo = String(data?.correlativo || '1').padStart(8, '0');
        const fileName = `${serie}-${correlativo}.pdf`;

        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        if (error.response) {
            console.error(`Error al generar pdf: ${error.response.status}`);
        } else {
            console.error('Error al generar pdf. Por favor, inténtelo de nuevo.');
        }
        toast.error('Error al generar PDF');
    }
};

export const handleSunatPDF = async (venta, detalles, nombre) => {
    const empresaData = await getEmpresaDataByUser(nombre);

    const totalGravada = detalles.reduce((acc, detalle) => {
        const precioUnitarioConIgv = parseFloat(detalle.precio.replace('S/ ', ''));
        const precioSinIgv = precioUnitarioConIgv / 1.18;
        return acc + (precioSinIgv * detalle.cantidad);
    }, 0);

    const mtoIGV = totalGravada * 0.18;
    const subTotal = totalGravada + mtoIGV;

    const tipoDocMapping = { "Boleta": "03", "Factura": "01" };
    const tipoDoc = tipoDocMapping[venta.tipoComprobante] || "03";
    const tipoDocMapping1 = { "Boleta": "B", "Factura": "F" };
    const ultimaSerie_n = tipoDocMapping1[venta.tipoComprobante] || "B";
    const nuevaSerie_t = ultimaSerie_n + venta.serieNum;

    const tipoDocCliente = venta?.documento?.length === 8 ? "1" : "6";
    const result = convertDateToDesiredFormat(venta.fechaEmision, -5);

    const data = {
        ublVersion: "2.1",
        tipoOperacion: "0101",
        tipoDoc: tipoDoc,
        serie: nuevaSerie_t.toString(),
        correlativo: venta.num.toString(),
        fechaEmision: result,
        formaPago: { moneda: "PEN", tipo: "Contado" },
        tipoMoneda: "PEN",
        client: {
            tipoDoc: tipoDocCliente,
            numDoc: venta.documento || '',
            rznSocial: venta.nombre || '',
            address: { direccion: "", provincia: "", departamento: "", distrito: "", ubigueo: "" }
        },
        company: {
            ruc: empresaData.ruc,
            razonSocial: empresaData.razonSocial,
            nombreComercial: empresaData.nombreComercial,
            address: {
                direccion: empresaData.direccion,
                provincia: empresaData.provincia,
                departamento: empresaData.departamento,
                distrito: empresaData.distrito,
                ubigueo: empresaData.ubigueo,
            },
        },
        mtoOperGravadas: totalGravada.toFixed(2),
        mtoIGV: mtoIGV.toFixed(2),
        valorVenta: totalGravada.toFixed(2),
        totalImpuestos: mtoIGV.toFixed(2),
        subTotal: subTotal.toFixed(2),
        mtoImpVenta: subTotal.toFixed(2),
        details: detalles.map(detalle => {
            const cantidad = parseInt(detalle.cantidad);
            const mtoValorUnitarioConIgv = parseFloat(detalle.precio.replace('S/ ', '')).toFixed(2);
            const mtoValorUnitarioSinIgv = (mtoValorUnitarioConIgv / 1.18).toFixed(2);
            const mtoValorVenta = (cantidad * mtoValorUnitarioSinIgv).toFixed(2);
            const mtoBaseIgv = mtoValorVenta;
            const igv = (parseFloat(mtoBaseIgv) * 0.18).toFixed(2);
            return {
                codProducto: detalle.codigo,
                unidad: detalle.undm || 'NIU',
                descripcion: detalle.nombre,
                cantidad: cantidad,
                mtoValorUnitario: mtoValorUnitarioSinIgv,
                mtoValorVenta: mtoValorVenta,
                mtoBaseIgv: mtoBaseIgv,
                porcentajeIgv: 18,
                igv: igv,
                tipAfeIgv: 10,
                totalImpuestos: igv,
                mtoPrecioUnitario: mtoValorUnitarioConIgv
            };
        }),
        legends: [{ code: "1000", value: `SON ${subTotal.toFixed(2)} CON 00/100 SOLES` }]
    };

    const currentName = nombre || useUserStore.getState().nombre;
    generarPDF(data, currentName).catch((error) => console.error(`Error al enviar pdf`));
};

// --- useProductosData (data_producto_venta.js) ---
export const useProductosData = () => {
    const [productos, setProductos] = useState([]);
    const sur = useUserStore((state) => state.sur);
    const { sucursales } = useSucursalData();

    useEffect(() => {
        if (!sur || sucursales.length === 0) return;
        const foundSucursal = sucursales.find(s => s.nombre === sur);
        const id_to_send = foundSucursal ? foundSucursal.id : sur;

        const fetchProductos = async () => {
            try {
                const response = await getProductosVentasRequest({ id_sucursal: id_to_send });
                if (response.data.code === 1) {
                    const productos = response.data.data.map(item => ({
                        codigo: item.codigo,
                        nombre: item.nombre,
                        precio: parseFloat(item.precio),
                        stock: parseInt(item.stock),
                        undm: item.undm,
                        nom_marca: item.nom_marca,
                        categoria: item.categoria_p,
                        codigo_barras: item.codigo_barras,
                    }));
                    setProductos(productos);
                } else {
                    console.error('Error en la solicitud: ', response.data.message);
                }
            } catch (error) {
                console.error('Error en la solicitud: ', error.message);
            }
        };
        fetchProductos();
    }, [sur, sucursales]);

    return { productos, setProductos };
};

// --- useSucursalData (data_sucursal_venta.js) ---
export const useSucursalData = () => {
    const [sucursales, setSucursal] = useState([]);
    useEffect(() => {
        const fetchSucursales = async () => {
            try {
                const response = await getSucursalRequest();
                if (response.data.code === 1) {
                    const sucursales = response.data.data.map(item => ({
                        id: item.id,
                        nombre: item.nombre,
                        ubicacion: item.ubicacion,
                        usuario: item.usuario,
                        rol: item.rol,
                    }));
                    setSucursal(sucursales);
                } else {
                    console.error('Error en la solicitud: ', response.data.message);
                }
            } catch (error) {
                console.error('Error en la solicitud: ', error.message);
            }
        };
        fetchSucursales();
    }, []);
    return { sucursales, setSucursal };
};

// --- useVentasData (data_venta.js) ---
export const useVentasData = (filters = {}) => {
    const [allVentas, setAllVentas] = useState([]);
    const [ventas, setVentas] = useState([]);
    const [totalVentas, setTotalVentas] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [ventasPerPage, setVentasPerPage] = useState(10);
    const [detalles, setDetalles] = useState([]);

    const addDetalle = (nuevoDetalle) => setDetalles(prev => [...prev, nuevoDetalle]);
    const updateDetalle = (detalleActualizado) => setDetalles(prev => prev.map(d => d.codigo === detalleActualizado.codigo ? detalleActualizado : d));
    const removeDetalle = (codigo) => setDetalles(prev => prev.filter(d => d.codigo !== codigo));
    const clearAllDetalles = () => setDetalles([]);

    const fetchVentas = useCallback(async () => {
        try {
            const response = await getVentasRequest();
            if (response.data.code === 1) {
                const ventas = response.data.data.map(venta => ({
                    id: venta.id,
                    serieNum: venta.serieNum,
                    num: venta.num,
                    tipoComprobante: venta.tipoComprobante,
                    cliente: venta.cliente_r ? venta.cliente_r : `${venta.cliente_n}`,
                    ruc: venta.ruc ? venta.ruc : `${venta.dni}`,
                    flex_cliente: venta.cliente_n,
                    flex_documento: venta.ruc || venta.dni,
                    flex_direccion: venta.direccion,
                    direccion: venta.direccion,
                    fechaEmision: venta.fecha ? venta.fecha : '',
                    fecha_iso: venta.fecha_iso,
                    metodo_pago: venta.metodo_pago,
                    id_anular: venta.id_anular,
                    anular: venta.anular,
                    id_anular_b: venta.id_anular_b,
                    anular_b: venta.anular_b,
                    estado_sunat: venta.estado_sunat,
                    id_venta_boucher: venta.id_venta_boucher,
                    ubicacion: venta.ubicacion,
                    usua_vendedor: venta.usua,
                    nombre_sucursal: venta.nombre_sucursal,
                    id_sucursal: venta.id_sucursal,
                    observacion: venta.observacion,
                    hora_creacion: venta.hora_creacion,
                    fecha_anulacion: venta.fecha_anulacion,
                    u_modifica: venta.u_modifica,
                    recibido: venta.recibido,
                    vuelto: venta.vuelto,
                    descuento: venta.descuento,

                    // Raw numeric values for Voucher/Calculation
                    total_raw: parseFloat(venta.total),
                    igv_raw: parseFloat(venta.igv),
                    recibido_raw: parseFloat(venta.recibido),
                    vuelto_raw: parseFloat(venta.vuelto),
                    descuento_raw: parseFloat(venta.descuento || 0),

                    igv: `S/ ${parseFloat(venta.igv).toFixed(2)}`,
                    total: `S/ ${parseFloat(venta.total).toFixed(2)}`,
                    cajero: venta.cajero,
                    cajeroId: venta.cajeroId,
                    estado: venta.estado === 0 ? 'Anulada' : venta.estado === 1 ? 'Aceptada' : venta.estado === 2 ? 'En proceso' : 'Desconocido',
                    detalles: venta.detalles.map(detalle => ({
                        codigo: detalle.codigo.toString().padStart(3, '0'),
                        nombre: detalle.nombre,
                        cantidad: detalle.cantidad,
                        undm: detalle.undm,
                        nom_marca: detalle.marca,
                        precio_raw: parseFloat(detalle.precio),
                        descuento_raw: parseFloat(detalle.descuento || 0),
                        subtotal_raw: parseFloat(detalle.subtotal),
                        precio: `S/ ${parseFloat(detalle.precio).toFixed(2)}`,
                        descuento: `S/ ${(detalle.descuento || 0).toFixed(2)}`,
                        igv: `S/ ${((detalle.precio * 0.18).toFixed(2))}`,
                        subtotal: `S/ ${parseFloat(detalle.subtotal).toFixed(2)}`,
                        // Pass variant info for badges
                        sku_label: detalle.sku_label,
                        attributes: detalle.attributes,
                        nombre_talla: detalle.nombre_talla,
                        nombre_tonalidad: detalle.nombre_tonalidad
                    }))
                }));
                setAllVentas(ventas);
            }
        } catch (error) {
            console.error('Error en la solicitud: ', error.message);
        }
    }, []);

    useEffect(() => {
        fetchVentas();
    }, [fetchVentas]);

    useEffect(() => {
        let filtradas = [...allVentas];
        const comprobanteMapReverse = { 1: 'Boleta', 2: 'Factura', 3: 'Nota' };

        if (filters.comprobanteSeleccionado) {
            let comprobantes = [];
            if (Array.isArray(filters.comprobanteSeleccionado)) {
                comprobantes = filters.comprobanteSeleccionado.map(tc => !isNaN(tc) ? comprobanteMapReverse[Number(tc)] : String(tc).charAt(0).toUpperCase() + String(tc).slice(1).toLowerCase());
            } else if (typeof filters.comprobanteSeleccionado === 'string') {
                comprobantes = filters.comprobanteSeleccionado.split(',').map(tc => {
                    tc = tc.trim();
                    return !isNaN(tc) ? comprobanteMapReverse[Number(tc)] : tc.charAt(0).toUpperCase() + tc.slice(1).toLowerCase();
                }).filter(tc => !!tc);
            }
            if (comprobantes.length > 0) {
                filtradas = filtradas.filter(v => comprobantes.includes(String(v.tipoComprobante)));
            }
        }

        if (filters.sucursalSeleccionado)
            filtradas = filtradas.filter(v => String(v.nombre_sucursal || '').toLowerCase() === String(filters.sucursalSeleccionado).toLowerCase());

        if (filters.estado && filters.estado !== "Todos") {
            filtradas = filtradas.filter(v => String(v.estado).toLowerCase() === String(filters.estado).toLowerCase());
        }

        if (filters.razon)
            filtradas = filtradas.filter(v => (v.cliente || '').toLowerCase().includes(String(filters.razon).toLowerCase()));

        if (filters.fecha_i)
            filtradas = filtradas.filter(v => (v.fechaEmision || '') >= String(filters.fecha_i));

        if (filters.fecha_e)
            filtradas = filtradas.filter(v => (v.fechaEmision || '') <= String(filters.fecha_e));

        if (filters.numC)
            filtradas = filtradas.filter(v => String(v.num || '').includes(String(filters.numC)));

        setTotalVentas(filtradas.length);
        const start = (currentPage - 1) * ventasPerPage;
        const end = start + ventasPerPage;
        setVentas(filtradas.slice(start, end));
    }, [allVentas, filters, currentPage, ventasPerPage]);

    const removeVenta = (id) => setAllVentas(prev => prev.filter(venta => venta.id !== id));
    const addVenta = (nuevaVenta) => setAllVentas(prev => [nuevaVenta, ...prev]);
    const updateVenta = (id, updatedData) => setAllVentas(prev => prev.map(venta => venta.id === id ? { ...venta, ...updatedData } : venta));

    const getTotalRecaudado = () => ventas.reduce((total, venta) => {
        if (venta.estado === 'Anulada') return total;
        const subtotalVenta = venta.detalles.reduce((subtotal, detalle) => {
            const rawSubtotal = typeof detalle.subtotal === 'string' ? detalle.subtotal.replace('S/ ', '') : (typeof detalle.subtotal === 'number' ? detalle.subtotal : '0');
            return subtotal + parseFloat(rawSubtotal || '0');
        }, 0);
        return total + subtotalVenta;
    }, 0).toFixed(2);

    const getTotalPagoElectronico = () => ventas.reduce((total, venta) => {
        if (venta.estado === 'Anulada') return total;
        const pagos = venta.metodo_pago.split(', ');
        const pagosElectronicos = pagos.filter(pago => !pago.startsWith('EFECTIVO'));
        return total + pagosElectronicos.reduce((suma, pago) => suma + (parseFloat(pago.split(':')[1]) || 0), 0);
    }, 0).toFixed(2);

    const totalRecaudado = getTotalRecaudado();
    const totalPagoElectronico = getTotalPagoElectronico();
    const totalEfectivo = (totalRecaudado - totalPagoElectronico).toFixed(2);

    return {
        ventas, detalles, addDetalle, updateDetalle, removeDetalle, clearAllDetalles,
        removeVenta, addVenta, updateVenta, currentPage, setCurrentPage,
        totalPages: Math.ceil(totalVentas / ventasPerPage), ventasPerPage, setVentasPerPage,
        totalRecaudado, totalEfectivo, totalPagoElectronico, allVentas, refreshVentas: fetchVentas
    };
};

// --- useVentasOnlineData (ventas desde tesis_db) ---
export const useVentasOnlineData = (filters = {}) => {
    const [allVentas, setAllVentas] = useState([]);
    const [ventas, setVentas] = useState([]);
    const [totalVentas, setTotalVentas] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [ventasPerPage, setVentasPerPage] = useState(10);
    const [totalOnline, setTotalOnline] = useState("0.00");
    const [cantidadOnline, setCantidadOnline] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchVentas = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getVentasOnlineRequest();
            if (response.data.code === 1) {
                const ventasData = response.data.data.map(venta => ({
                    id: venta.id,
                    serieNum: venta.serieNum || 'ONL',
                    num: venta.num || String(venta.id).padStart(8, '0'),
                    tipoComprobante: 'Online',
                    cliente: venta.cliente || 'Cliente',
                    dni: venta.dni || '',
                    email: venta.email || '',
                    telefono: venta.telefono || '',
                    direccion: venta.direccion || '',
                    fechaEmision: venta.fechaEmision ? new Date(venta.fechaEmision).toISOString().split('T')[0] : '',
                    fechaVerificacion: venta.fechaVerificacion,
                    metodo_pago: venta.metodo_pago || 'Electrónico',
                    transaccion: venta.transaccion || '',
                    almacen: venta.almacen || '',
                    estado: venta.estado || 'Aceptada',
                    estado_verificacion: venta.estado_verificacion,
                    observacion: venta.observacion,
                    origen: 'online',
                    cajero: 'Sistema Online',
                    total_raw: parseFloat(venta.total || 0),
                    igv_raw: parseFloat(venta.igv || 0),
                    igv: `S/ ${parseFloat(venta.igv || 0).toFixed(2)}`,
                    total: `S/ ${parseFloat(venta.total || 0).toFixed(2)}`,
                    detalles: (venta.detalles || []).map(detalle => ({
                        codigo: String(detalle.codigo || detalle.id_producto || '').padStart(3, '0'),
                        nombre: detalle.nombre || detalle.descripcion || '',
                        cantidad: detalle.cantidad || 0,
                        undm: detalle.undm || 'UND',
                        precio_raw: parseFloat(detalle.precio || 0),
                        subtotal_raw: parseFloat(detalle.subtotal || 0),
                        precio: `S/ ${parseFloat(detalle.precio || 0).toFixed(2)}`,
                        subtotal: `S/ ${parseFloat(detalle.subtotal || 0).toFixed(2)}`
                    }))
                }));
                setAllVentas(ventasData);
                setTotalOnline(response.data.totalOnline || "0.00");
                setCantidadOnline(response.data.cantidadOnline || 0);
            }
        } catch (error) {
            console.error('Error al obtener ventas online:', error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVentas();
    }, [fetchVentas]);

    useEffect(() => {
        let filtradas = [...allVentas];

        if (filters.estado && filters.estado !== "Todos") {
            filtradas = filtradas.filter(v => String(v.estado).toLowerCase() === String(filters.estado).toLowerCase());
        }

        if (filters.razon) {
            filtradas = filtradas.filter(v => (v.cliente || '').toLowerCase().includes(String(filters.razon).toLowerCase()));
        }

        if (filters.fecha_i) {
            filtradas = filtradas.filter(v => (v.fechaEmision || '') >= String(filters.fecha_i));
        }

        if (filters.fecha_e) {
            filtradas = filtradas.filter(v => (v.fechaEmision || '') <= String(filters.fecha_e));
        }

        setTotalVentas(filtradas.length);
        const start = (currentPage - 1) * ventasPerPage;
        const end = start + ventasPerPage;
        setVentas(filtradas.slice(start, end));
    }, [allVentas, filters, currentPage, ventasPerPage]);

    return {
        ventas,
        allVentas,
        loading,
        currentPage,
        setCurrentPage,
        totalPages: Math.ceil(totalVentas / ventasPerPage),
        ventasPerPage,
        setVentasPerPage,
        totalOnline,
        cantidadOnline,
        refreshVentas: fetchVentas
    };
};

// --- useVentasStats (data_venta_stats.js) ---
export const useVentasStats = (filters = {}) => {
    const [allVentas, setAllVentas] = useState([]);
    const [filteredVentas, setFilteredVentas] = useState([]);
    const [totalRecaudado, setTotalRecaudado] = useState(0);
    const [totalEfectivo, setTotalEfectivo] = useState(0);
    const [totalElectronico, setTotalElectronico] = useState(0);
    const [cantidadVentas, setCantidadVentas] = useState(0);

    const fetchVentas = useCallback(async () => {
        try {
            const response = await getVentasRequest();
            if (response.data.code === 1) {
                const ventas = response.data.data.map(venta => ({
                    id: venta.id,
                    serieNum: venta.serieNum,
                    num: venta.num,
                    tipoComprobante: venta.tipoComprobante,
                    cliente: venta.cliente_r ? venta.cliente_r : `${venta.cliente_n}`,
                    ruc: venta.ruc ? venta.ruc : `${venta.dni}`,
                    fechaEmision: venta.fecha ? venta.fecha : '',
                    fecha_iso: venta.fecha_iso,
                    metodo_pago: venta.metodo_pago,
                    estado: venta.estado === 0 ? 'Anulada' : venta.estado === 1 ? 'Aceptada' : venta.estado === 2 ? 'En proceso' : 'Desconocido',
                    nombre_sucursal: venta.nombre_sucursal,
                    detalles: venta.detalles.map(detalle => ({
                        subtotal: detalle.subtotal
                    }))
                }));
                setAllVentas(ventas);
            }
        } catch (error) {
            console.error('Error en la solicitud: ', error.message);
        }
    }, []);

    useEffect(() => {
        fetchVentas();
    }, [fetchVentas]);

    useEffect(() => {
        let filtradas = [...allVentas];

        if (filters.tipoComprobante && filters.tipoComprobante.size > 0) {
            const selectedTypes = Array.from(filters.tipoComprobante);
            if (selectedTypes.length > 0) {
                filtradas = filtradas.filter(v => selectedTypes.includes(String(v.tipoComprobante)));
            }
        }
        if (filters.sucursal)
            filtradas = filtradas.filter(v => String(v.nombre_sucursal || '').toLowerCase() === String(filters.sucursal).toLowerCase());
        if (filters.estado && filters.estado !== "Todos") {
            filtradas = filtradas.filter(v => String(v.estado).toLowerCase() === String(filters.estado).toLowerCase());
        }
        if (filters.fecha_i)
            filtradas = filtradas.filter(v => (v.fechaEmision || '') >= String(filters.fecha_i));
        if (filters.fecha_e)
            filtradas = filtradas.filter(v => (v.fechaEmision || '') <= String(filters.fecha_e));

        setFilteredVentas(filtradas);
        setCantidadVentas(filtradas.length);

        const totalRec = filtradas.reduce((total, venta) => {
            if (venta.estado === 'Anulada') return total;
            const subtotalVenta = venta.detalles.reduce((subtotal, detalle) => {
                const rawSubtotal = typeof detalle.subtotal === 'string' ? detalle.subtotal.replace('S/ ', '') : (typeof detalle.subtotal === 'number' ? detalle.subtotal : '0');
                return subtotal + parseFloat(rawSubtotal || '0');
            }, 0);
            return total + subtotalVenta;
        }, 0);

        const totalElec = filtradas.reduce((total, venta) => {
            if (venta.estado === 'Anulada') return total;
            const pagos = venta.metodo_pago.split(', ');
            const pagosElectronicos = pagos.filter(pago => !pago.startsWith('EFECTIVO'));
            return total + pagosElectronicos.reduce((suma, pago) => suma + (parseFloat(pago.split(':')[1]) || 0), 0);
        }, 0);

        setTotalRecaudado(totalRec.toFixed(2));
        setTotalElectronico(totalElec.toFixed(2));
        setTotalEfectivo((totalRec - totalElec).toFixed(2));
    }, [allVentas, filters]);

    return { ventas: filteredVentas, totalRecaudado, totalEfectivo, totalElectronico, cantidadVentas, refreshVentas: fetchVentas };
};

// --- handleDelete (delete_venta.js) ---
export const handleDelete = async (datosVenta) => {
    const payload = {
        id_venta: datosVenta.id,
        comprobante: datosVenta.tipoComprobante,
        estado_sunat: Number(datosVenta.estado_sunat) || 0,
        estado_venta: 0, // FORCE ANULACION
        usua: datosVenta.usua_usuario || useUserStore.getState().nombre,
        id_usuario: datosVenta.id_usuario,
    };

    try {
        const response = await deleteVentaRequest(payload);
        if (response.status === 200) {

        } else {
            console.error('Error al registrar la venta:', response.data);
        }
    } catch (error) {
        console.error('Error de red:', error);
    }
};

// --- generateComprobanteNumber (generate_comprobante.js) ---
export const generateComprobanteNumber = async (id_comprobante, nombre) => {
    try {
        const response = await getNumeroComprobanteRequest({ id_comprobante, usuario: nombre });
        const nuevoNumComprobante = response.data.nuevoNumComprobante;
        if (Array.isArray(nuevoNumComprobante)) {
            return nuevoNumComprobante[0];
        }
        return nuevoNumComprobante;
    } catch (error) {
        console.error('Error al generar el número de comprobante:', error);
        throw error;
    }
};

// --- useLastData (getLastVenta.js) ---
export const useLastData = () => {
    const [last, setLast] = useState([]);
    useEffect(() => {
        const fetchLast = async () => {
            try {
                const response = await getLastVentaRequest();
                if (response.data.code === 1) {
                    const ultimos = response.data.data.map(item => ({ id: item.id }));
                    setLast(ultimos);
                } else {
                    console.error('Error en la solicitud: ', response.data.message);
                }
            } catch (error) {
                console.error('Error en la solicitud: ', error.message);
            }
        };
        fetchLast();
    }, []);
    return { last, setLast };
};

// --- useLibroVentasSunatData (getLibroVenta.js) ---
export const useLibroVentasSunatData = (filters) => {
    const [allVentas, setAllVentas] = useState([]);
    const [ventas, setVentas] = useState([]);
    const [totales, setTotales] = useState({ total_importe: 0, total_igv: 0, total_general: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [metadata, setMetadata] = useState({ total_records: 0, current_page: 1, per_page: 10, total_pages: 0 });

    useEffect(() => {
        const fetchAllVentas = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await getLibroVentasSunat({});
                if (response && response.data) {
                    setAllVentas(response.data || []);
                }
            } catch (error) {
                setError("Error al obtener datos");
                setAllVentas([]);
                console.error('Error en fetchAllVentas:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAllVentas();
    }, []);

    useEffect(() => {
        setLoading(true);
        let filtradas = [...allVentas];

        if (filters.idSucursal) {
            filtradas = filtradas.filter(v => String(v.id_sucursal) === String(filters.idSucursal));
        }

        if (filters.tipoComprobante) {
            let comprobantes = [];
            if (Array.isArray(filters.tipoComprobante)) {
                comprobantes = filters.tipoComprobante.map(tc => String(tc).trim().toLowerCase());
            } else if (typeof filters.tipoComprobante === 'string') {
                comprobantes = filters.tipoComprobante.split(',').map(tc => tc.trim().toLowerCase()).filter(tc => tc.length > 0);
            }
            if (comprobantes.length > 0) {
                filtradas = filtradas.filter(v => comprobantes.includes(String(v.tipo_comprobante || v.comprobante || "").toLowerCase()));
            }
        }

        if (filters.startDate && filters.endDate) {
            const start = filters.startDate;
            const end = filters.endDate;
            filtradas = filtradas.filter(v => {
                if (!v.fecha) return false;
                const fechaVenta = String(v.fecha).slice(0, 10);
                return fechaVenta >= start && fechaVenta <= end;
            });
        }

        const total_importe = filtradas.reduce((sum, row) => sum + (parseFloat(row.importe) || 0), 0);
        const total_igv = filtradas.reduce((sum, row) => sum + (parseFloat(row.igv) || 0), 0);
        const total_general = filtradas.reduce((sum, row) => sum + (parseFloat(row.total) || 0), 0);

        setTotales({ total_importe, total_igv, total_general });

        const total_records = filtradas.length;
        const total_pages = Math.ceil(total_records / limit);
        const start = (page - 1) * limit;
        const end = start + limit;
        setVentas(filtradas.slice(start, end));
        setMetadata({ total_records, current_page: page, per_page: limit, total_pages });
        setLoading(false);
    }, [allVentas, filters, page, limit]);

    const changePage = (newPage) => setPage(newPage);
    const changeLimit = (newLimit) => { setLimit(newLimit); setPage(1); };
    const updateFilters = (newFilters) => setPage(1);

    return { ventas, totales, loading, error, metadata, page, limit, changePage, changeLimit, updateFilters, refetch: () => { } };
};

// --- handleUpdateMultiple (update_venta_multiple.js) ---
export const handleUpdateMultiple = async (ventas) => {
    try {
        const updatePromises = ventas.map(venta => updateVentaEstadoRequest({ id_venta: venta.id }));
        const responses = await Promise.all(updatePromises);
        responses.forEach((response, index) => {
            if (response.status === 200) {
                // success
            } else {
                console.error(`Error al actualizar la venta ${ventas[index].id}:`, response.data);
            }
        });
    } catch (error) {
        console.error('Error de red:', error);
    }
};
