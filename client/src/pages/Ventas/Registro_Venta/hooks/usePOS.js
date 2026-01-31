import { useState, useMemo, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
    useProductosData,
    useClientesData,
    useSucursalData,
    generateComprobanteNumber,
    handleCobrar
} from "@/services/ventas.services";
import { handlePrintThermal } from '@/services/print.services';
import { useUserStore } from '@/store/useStore';

export const usePOS = () => {
    const nombreUsuario = useUserStore((state) => state.nombre);
    const usuario = useUserStore(state => state.usuario);
    const sur = useUserStore(state => state.sur);

    // --- Data Sources ---
    const { productos, setProductos } = useProductosData();
    const { clientes, addCliente } = useClientesData();
    const { sucursales } = useSucursalData();

    // Resolve Sucursal
    const sucursalV = useMemo(() => {
        const found = (sucursales || []).find(
            s => String(s.nombre || '').toLowerCase() === String(sur || '').toLowerCase()
        ) || null;
        return {
            id: found?.id || null,
            nombre: found?.nombre || sur || '',
            ubicacion: found?.ubicacion || '',
        };
    }, [sucursales, sur]);

    // --- State ---
    const [cart, setCart] = useState([]);
    const [client, setClient] = useState(null); // { id, nombre, documento, direccion, tipo }
    const [documentType, setDocumentType] = useState('Boleta');
    const [comprobanteNumber, setComprobanteNumber] = useState(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [stockOriginal, setStockOriginal] = useState({});

    // --- Initialization ---
    useEffect(() => {
        if (productos.length > 0 && Object.keys(stockOriginal).length === 0) {
            const stockMap = {};
            productos.forEach(p => stockMap[p.codigo] = p.stock);
            setStockOriginal(stockMap);
        }
    }, [productos, stockOriginal]);

    // --- Cart Actions ---
    const addToCart = useCallback((product) => {
        // Generate unique key for cart item (supporting variants via SKU)
        const uniqueKey = product.id_sku
            ? `SKU-${product.id_sku}`
            : `${product.codigo}-${product.id_tonalidad || 'null'}-${product.id_talla || 'null'}`;

        if (product.stock <= 0) {
            toast.error('Producto sin stock');
            return;
        }

        // Calculate if adding this product would exceed limits
        const existingItem = cart.find(item => item.uniqueKey === uniqueKey);
        let newTotal;

        if (existingItem) {
            newTotal = cart.reduce((acc, item) => {
                const price = parseFloat(item.precio) || 0;
                const qty = item.uniqueKey === uniqueKey ? item.cantidad + product.cantidad : item.cantidad; // Handle bulk add if product.cantidad > 1
                const discountPct = parseFloat(item.descuento) || 0;
                return acc + (price * qty * (1 - discountPct / 100));
            }, 0);
        } else {
            const currentTotal = cart.reduce((acc, item) => {
                const price = parseFloat(item.precio) || 0;
                const qty = item.cantidad || 1;
                const discountPct = parseFloat(item.descuento) || 0;
                return acc + (price * qty * (1 - discountPct / 100));
            }, 0);
            newTotal = currentTotal + (parseFloat(product.precio) * (product.cantidad || 1));
        }

        // Legacy Validation: 499 Soles Limit
        if (newTotal > 499) {
            toast.error(`No se puede agregar. El total excedería S/ 499.00`);
            return;
        }

        const qtyToAdd = product.cantidad || 1;

        // Update cart
        if (existingItem) {
            setCart(prevCart =>
                prevCart.map(item =>
                    item.uniqueKey === uniqueKey
                        ? { ...item, cantidad: item.cantidad + qtyToAdd }
                        : item
                )
            );
        } else {
            setCart(prevCart => [
                ...prevCart,
                {
                    ...product,
                    uniqueKey,
                    cantidad: qtyToAdd,
                    descuento: 0,
                    precio_venta: product.precio
                }
            ]);
        }

        // Consume Stock - Visual Update on Grid
        setProductos(prev => prev.map(p =>
            p.codigo === product.codigo ? { ...p, stock: p.stock - qtyToAdd } : p
        ));
    }, [cart, setProductos]);

    const removeFromCart = useCallback((uniqueKey, cantidad, codigo) => {
        setCart(prev => prev.filter(item => item.uniqueKey !== uniqueKey));
        // Restore stock visual
        setProductos(prev => prev.map(p =>
            p.codigo === codigo ? { ...p, stock: p.stock + cantidad } : p
        ));
    }, [setProductos]);

    const updateQuantity = useCallback((uniqueKey, newQuantity, codigo) => {
        if (newQuantity < 1) return;

        const item = cart.find(i => i.uniqueKey === uniqueKey);
        if (!item) return;

        const diff = newQuantity - item.cantidad;
        const productInStock = productos.find(p => p.codigo === codigo);

        // Limit Check for Variants (item.stock holds the max stock for that specific SKU)
        if (item.id_sku && newQuantity > item.stock) {
            toast.error(`Solo hay ${item.stock} unidades de este variante`);
            return;
        }

        // If diff > 0 (increasing qty), we consume stock.
        if (diff > 0 && productInStock.stock < diff) {
            toast.error(`Solo quedan ${productInStock.stock} unidades`);
            return;
        }

        // Update cart quantity
        setCart(prevCart =>
            prevCart.map(i => i.uniqueKey === uniqueKey ? { ...i, cantidad: newQuantity } : i)
        );

        // Update stock - OUTSIDE of setCart callback to prevent double execution
        setProductos(prev => prev.map(p =>
            p.codigo === codigo ? { ...p, stock: p.stock - diff } : p
        ));
    }, [cart, productos, setProductos]);

    const updatePrice = useCallback((uniqueKey, newPrice) => {
        setCart(prev => prev.map(item =>
            item.uniqueKey === uniqueKey ? { ...item, precio: newPrice } : item
        ));
    }, []);

    // --- Cart Actions ---
    // 1. Cancel/Clear Cart -> Restores Item Stock (User aborted)
    const cancelCart = useCallback(() => {
        setProductos(prev => prev.map(p => {
            const inCartItems = cart.filter(c => c.codigo === p.codigo);
            const totalQty = inCartItems.reduce((acc, c) => acc + c.cantidad, 0);
            return totalQty > 0 ? { ...p, stock: p.stock + totalQty } : p;
        }));
        setCart([]);
        setClient(null);
        setDocumentType('Boleta');
    }, [cart, setProductos]);

    // 2. Complete Sale -> Keeps Stock Deducted (User bought)
    const completeSale = useCallback(() => {
        setCart([]);
        setClient(null);
        setDocumentType('Boleta');
        // Do NOT restore stock here.
    }, []);

    // --- Calculations ---
    const totals = useMemo(() => {
        const totalPayable = cart.reduce((acc, item) => {
            const price = parseFloat(item.precio) || 0;
            const qty = item.cantidad || 1;
            const discountPct = parseFloat(item.descuento) || 0;
            return acc + (price * qty * (1 - discountPct / 100));
        }, 0);

        return {
            total: totalPayable,
            subtotal: totalPayable / 1.18,
            igv: totalPayable - (totalPayable / 1.18),
            itemCount: cart.reduce((acc, item) => acc + item.cantidad, 0)
        };
    }, [cart]);

    // --- Helpers ---
    const generateNumber = async () => {
        try {
            const num = await generateComprobanteNumber(documentType, nombreUsuario);
            setComprobanteNumber(num);
            return num;
        } catch (e) {
            console.error(e);
            return null;
        }
    };

    // --- Submit Logic (Saving Sale) ---
    const submitSale = async (paymentDetails, observacion) => {
        const numComprobante = await generateNumber();
        if (!numComprobante) {
            toast.error("Error generando número de comprobante");
            return false;
        }

        const now = new Date();
        const tzOffset = now.getTimezoneOffset() * 60000;
        const localDate = new Date(now.getTime() - tzOffset).toISOString().slice(0, 10);
        const fechaIsoLocal = new Date(now.getTime() - tzOffset).toISOString();

        // Construct Data Object (Legacy Format)
        const datosVenta = {
            usuario: usuario || nombreUsuario || 'admin',
            id_comprobante: documentType,
            id_cliente: client?.id || client?.nombre || client?.razon_social || 'Clientes Varios', // Prefer ID for robust lookup
            estado_venta: 1,
            // estado_sunat se inicializa en 0, se actualizará a 1 solo si SUNAT responde exitosamente
            ...(documentType !== 'Nota de venta' && { estado_sunat: 0 }),
            sucursal: sucursalV?.nombre || "",
            direccion: sucursalV?.ubicacion || "",
            f_venta: localDate,
            fecha_iso: fechaIsoLocal,
            fecha: localDate,
            igv: totals.igv.toFixed(2),
            total_t: totals.total,
            totalImporte_venta: totals.subtotal.toFixed(2),
            descuento_venta: "0.00", // Discount implementation simplified for now
            vuelto: paymentDetails.change.toFixed(2),
            recibido: parseFloat(paymentDetails.amountReceived).toFixed(2),
            metodo_pago: paymentDetails.method, // Now a string like "EFECTIVO:50.00|YAPE:20.00"
            formadepago: paymentDetails.method,
            nombre_cliente: client?.nombre || 'Clientes Varios',
            documento_cliente: client?.documento || '00000000',
            direccion_cliente: client?.direccion || 'Sin dirección',
            comprobante_pago: documentType === 'Boleta' ? 'Boleta de venta electronica' : documentType === 'Factura' ? 'Factura de venta electronica' : 'Nota de venta',
            detalles: cart.map(item => ({
                id_producto: item.codigo,
                cantidad: item.cantidad,
                precio: parseFloat(item.precio),
                descuento: 0,
                total: (item.cantidad * item.precio).toFixed(2),
                id_tonalidad: item.id_tonalidad || null,
                id_talla: item.id_talla || null,
                id_sku: item.id_sku || null // Added SKU
            })),
            detalles_b: cart.map(item => {
                // Determine display attributes
                let attrText = "";
                if (item.attributes) {
                    attrText = Object.entries(item.attributes)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(", ");
                }

                return {
                    id_producto: item.codigo,
                    nombre: item.nombre,
                    // If SKU name exists, append it or use it?
                    // Legacy printed ticket might rely on nombre_tonalidad/nombre_talla
                    cantidad: item.cantidad,
                    precio: parseFloat(item.precio),
                    sub_total: item.cantidad * parseFloat(item.precio),
                    descuento: 0,
                    undm: item.undm || '',
                    nom_marca: item.nom_marca || '',
                    nombre_tonalidad: item.nombre_tonalidad || (item.attributes?.["Color"] || ''),
                    nombre_talla: item.nombre_talla || (item.attributes?.["Talla"] || ''),
                    sku_label: item.sku_label,
                    sku_display: attrText // New field for generic attributes on Voucher?
                };
            }),
            observacion: observacion || ''
        };

        // Datos Comprobante for printing
        const datosVentaComprobante = {
            ...datosVenta,
            detalles: datosVenta.detalles_b // Printing uses detalles_b format
        };

        // Construct Data Object specifically for handleSunatUnique
        // Use detalles_b format which includes nombre, undm for SUNAT
        // Parse numComprobante: "B600-00000001" => serie="600", correlativo="00000001"
        const comprobantePartes = numComprobante.split('-');
        const serieFromComprobante = comprobantePartes[0].substring(1); // Remove prefix (B or F), get "600"
        const correlativoFromComprobante = comprobantePartes[1] || numComprobante; // Get "00000001"

        const datosVentaSunat = {
            ...datosVenta,
            tipoComprobante: documentType,
            num: correlativoFromComprobante, // Only the correlativo part for SUNAT
            serieNum: serieFromComprobante,  // The actual serie from the comprobante
            ruc: client?.documento || '',
            cliente: client?.nombre || 'Clientes Varios',
            // Override detalles with proper format for SUNAT
            detalles: cart.map(item => ({
                codigo: item.codigo,
                nombre: item.nombre + (item.nombre_sku ? ` - ${item.nombre_sku}` : ''), // Append SKU info to name for SUNAT
                cantidad: item.cantidad,
                precio: parseFloat(item.precio),
                undm: item.undm || 'NIU',
                descuento: 0,
                subtotal: (item.cantidad * item.precio).toFixed(2)
            }))
        };

        // Call Legacy Save Function
        await handleCobrar(
            datosVenta, // Payload for Backend
            () => {
                // Success Callback - Print
                handlePrintThermal(
                    datosVentaComprobante,
                    datosVenta,
                    observacion,
                    nombreUsuario,
                    numComprobante,
                    'window'
                );
                // toast handled in services
                completeSale();
            },
            datosVentaSunat, // Payload for handleSunatUnique (Critical Fix)
            null, // ven (legacy logic uses handleUpdate(ven) which seems unused for new sales, passing null)
            nombreUsuario // nombre (Critical for getEmpresaDataByUser in handleSunatUnique)
        );

        return true;
    };

    return {
        productos,
        cart,
        client,
        documentType,
        totals,
        globalFilter,
        selectedCategory,
        setGlobalFilter,
        setSelectedCategory,
        setClient,
        setDocumentType,
        addToCart,
        removeFromCart,
        updateQuantity,
        updatePrice,
        clearCart: cancelCart, // UI "Clear" button restores stock
        completeSale,          // Internal use for successful sales
        generateNumber,
        submitSale,
        sucursalV
    };
};
