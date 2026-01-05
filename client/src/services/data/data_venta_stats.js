import { useState, useEffect, useCallback } from 'react';
import { getVentasRequest } from "@/api/api.ventas";

const useVentasStats = (filters = {}) => {
    const [allVentas, setAllVentas] = useState([]);
    const [filteredVentas, setFilteredVentas] = useState([]);

    // Totales
    const [totalRecaudado, setTotalRecaudado] = useState(0);
    const [totalEfectivo, setTotalEfectivo] = useState(0);
    const [totalElectronico, setTotalElectronico] = useState(0);
    const [cantidadVentas, setCantidadVentas] = useState(0);

    // Solo consulta la base de datos la primera vez (o cuando se requiera refrescar)
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
                    igv: `S/ ${parseFloat(venta.igv).toFixed(2)}`,
                    total: `S/ ${parseFloat(venta.total).toFixed(2)}`,
                    cajero: venta.cajero,
                    cajeroId: venta.cajeroId,
                    estado: venta.estado === 0 ? 'Anulada' :
                        venta.estado === 1 ? 'Aceptada' :
                            venta.estado === 2 ? 'En proceso' : 'Desconocido',
                    detalles: venta.detalles.map(detalle => ({
                        codigo: detalle.codigo.toString().padStart(3, '0'),
                        nombre: detalle.nombre,
                        cantidad: detalle.cantidad,
                        undm: detalle.undm,
                        nom_marca: detalle.marca,
                        precio: `S/ ${parseFloat(detalle.precio).toFixed(2)}`,
                        descuento: `S/ ${(detalle.descuento || 0).toFixed(2)}`,
                        igv: `S/ ${((detalle.precio * 0.18).toFixed(2))}`,
                        subtotal: `S/ ${parseFloat(detalle.subtotal).toFixed(2)}`
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

    // Filtros
    useEffect(() => {
        let filtradas = [...allVentas];

        // Mapeo inverso de número a nombre
        const comprobanteMapReverse = {
            1: 'Boleta',
            2: 'Factura',
            3: 'Nota',
        };

        // Filtro por tipo de comprobante
        if (filters.tipoComprobante && filters.tipoComprobante.size > 0) {
            const selectedTypes = Array.from(filters.tipoComprobante);
            // Los valores vienen como "Boleta", "Factura", "Nota" desde el Select

            if (selectedTypes.length > 0) {
                filtradas = filtradas.filter(
                    v => selectedTypes.includes(String(v.tipoComprobante))
                );
            }
        }

        // Filtro por sucursal
        if (filters.sucursal)
            filtradas = filtradas.filter(
                v => String(v.nombre_sucursal || '').toLowerCase() === String(filters.sucursal).toLowerCase()
            );

        // Filtro por estado
        if (filters.estado && filters.estado !== "Todos") {
            filtradas = filtradas.filter(
                v => String(v.estado).toLowerCase() === String(filters.estado).toLowerCase()
            );
        }

        // Filtro por fecha de inicio
        if (filters.fecha_i)
            filtradas = filtradas.filter(
                v => (v.fechaEmision || '') >= String(filters.fecha_i)
            );

        // Filtro por fecha de fin
        if (filters.fecha_e)
            filtradas = filtradas.filter(
                v => (v.fechaEmision || '') <= String(filters.fecha_e)
            );

        setFilteredVentas(filtradas);
        setCantidadVentas(filtradas.length);

        // Calcular totales
        const totalRec = filtradas.reduce((total, venta) => {
            if (venta.estado === 'Anulada') return total;
            const subtotalVenta = venta.detalles.reduce((subtotal, detalle) => {
                const rawSubtotal = typeof detalle.subtotal === 'string'
                    ? detalle.subtotal.replace('S/ ', '')
                    : (typeof detalle.subtotal === 'number' ? detalle.subtotal : '0');
                return subtotal + parseFloat(rawSubtotal || '0');
            }, 0);
            return total + subtotalVenta;
        }, 0);

        const totalElec = filtradas.reduce((total, venta) => {
            if (venta.estado === 'Anulada') return total;
            const pagos = venta.metodo_pago.split(', ');
            const pagosElectronicos = pagos.filter(pago => !pago.startsWith('EFECTIVO'));
            const totalElectronico = pagosElectronicos.reduce((suma, pago) => {
                const monto = parseFloat(pago.split(':')[1]) || 0;
                return suma + monto;
            }, 0);
            return total + totalElectronico;
        }, 0);

        setTotalRecaudado(totalRec.toFixed(2));
        setTotalElectronico(totalElec.toFixed(2));
        setTotalEfectivo((totalRec - totalElec).toFixed(2));

    }, [allVentas, filters]);

    return {
        ventas: filteredVentas,
        totalRecaudado,
        totalEfectivo,
        totalElectronico,
        cantidadVentas,
        refreshVentas: fetchVentas
    };
};

export default useVentasStats;
