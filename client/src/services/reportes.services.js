import { useState, useEffect, useRef, useCallback } from 'react';
import {
    getAnalisisGananciasSucursalesRequest,
    getTotalProductosVendidosRequest,
    getCantidadVentasPorProductoRequest,
    getTopProductosMargenRequest,
    getTotalSalesRevenueRequest,
    getTendenciaVentasRequest,
    getProductoMasVendidoRequest,
    getCantidadVentasPorSubcategoriaRequest,
    getSucursalMayorRendimientoRequest,
    getVentasPDFRequest
} from "@/api/api.reporte";

// --- useAnalisisGananciasSucursales ---
export const useAnalisisGananciasSucursales = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const cacheRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            if (cacheRef.current) {
                setData(cacheRef.current);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const response = await getAnalisisGananciasSucursalesRequest();
                if (response.data.code === 1) {
                    setData(response.data.data);
                    cacheRef.current = response.data.data;
                } else {
                    setError('Error en la solicitud: ' + response.data.message);
                }
            } catch (error) {
                setError('Error en la solicitud: ' + error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return { data, loading, error };
};

// --- useTotalProductosVendidos ---
export const useTotalProductosVendidos = (idSucursal, year, month, week) => {
    const [data, setData] = useState({
        totalProductosVendidos: 0,
        totalAnterior: 0,
        porcentaje: 0,
        subcategorias: {},
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const lastParams = useRef({});

    useEffect(() => {
        const params = { id_sucursal: idSucursal, year, month, week };
        Object.keys(params).forEach(key => {
            if (params[key] === undefined || params[key] === "") delete params[key];
        });

        const paramsString = JSON.stringify(params);
        if (lastParams.current.paramsString === paramsString) return;
        lastParams.current.paramsString = paramsString;

        setLoading(true);
        setError(null);

        getTotalProductosVendidosRequest(params)
            .then(response => {
                if (response.status === 200 && response.data.code === 1) {
                    setData({
                        totalProductosVendidos: parseInt(response.data.totalProductosVendidos || 0, 10),
                        totalAnterior: parseInt(response.data.totalAnterior || 0, 10),
                        porcentaje: parseFloat(response.data.porcentaje || 0).toFixed(2),
                        subcategorias: response.data.subcategorias || {},
                    });
                } else {
                    setData({
                        totalProductosVendidos: 0,
                        totalAnterior: 0,
                        porcentaje: 0,
                        subcategorias: {},
                    });
                }
            })
            .catch(error => {
                setData({
                    totalProductosVendidos: 0,
                    totalAnterior: 0,
                    porcentaje: 0,
                    subcategorias: {},
                });
                setError(error.message || "Error en la consulta");
            })
            .finally(() => setLoading(false));
    }, [idSucursal, year, month, week]);

    return { ...data, loading, error };
};

// --- useCantidadVentasPorProducto ---
export const useCantidadVentasPorProducto = (idSucursal, year, month, week) => {
    const [ventasPorProducto, setVentasPorProducto] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const lastParamsRef = useRef({});

    const fetchCantidadVentasPorProducto = useCallback(async () => {
        const params = { id_sucursal: idSucursal, year, month, week };

        Object.keys(params).forEach(key => {
            if (params[key] === undefined || params[key] === "") {
                delete params[key];
            }
        });

        const lastParams = lastParamsRef.current;
        const paramsStr = JSON.stringify(params);
        const lastParamsStr = JSON.stringify(lastParams);

        if (paramsStr === lastParamsStr) {
            return;
        }

        lastParamsRef.current = params;

        setLoading(true);
        setError(null);

        try {
            const response = await getCantidadVentasPorProductoRequest(params);
            if (response.data.code === 1) {
                setVentasPorProducto(response.data.data);
            } else {
                setError('Error en la solicitud: ' + response.data.message);
                setVentasPorProducto([]);
            }
        } catch (error) {
            setError('Error en la solicitud: ' + error.message);
            setVentasPorProducto([]);
        } finally {
            setLoading(false);
        }
    }, [idSucursal, year, month, week]);

    useEffect(() => {
        fetchCantidadVentasPorProducto();
    }, [fetchCantidadVentasPorProducto]);

    return { ventasPorProducto, loading, error };
};

// --- useTopProductosMargen ---
export const useTopProductosMargen = (idSucursal, year, month, week, limit = 5) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const cacheRef = useRef({});
    const lastKeyRef = useRef(null);

    const fetchTopProductosMargen = useCallback(async () => {
        const params = { id_sucursal: idSucursal, year, month, week, limit };

        Object.keys(params).forEach(key => {
            if (params[key] === undefined || params[key] === '') {
                delete params[key];
            }
        });

        const cacheKey = JSON.stringify(params);

        if (cacheKey === lastKeyRef.current && cacheRef.current[cacheKey]) {
            setData(cacheRef.current[cacheKey]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        lastKeyRef.current = cacheKey;

        try {
            const response = await getTopProductosMargenRequest(params);
            if (response.data.code === 1 && Array.isArray(response.data.data)) {
                setData(response.data.data);
                cacheRef.current[cacheKey] = response.data.data;
            } else {
                throw new Error(response.data.message || "Respuesta inválida");
            }
        } catch (err) {
            setError('Error en la solicitud');
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [idSucursal, year, month, week, limit]);

    useEffect(() => {
        fetchTopProductosMargen();
    }, [fetchTopProductosMargen]);

    return { data, loading, error };
};

// --- useVentasData (Total Sales Revenue) ---
export const useVentasData = (idSucursal, year, month, week) => {
    const [data, setData] = useState({
        totalRecaudado: 0,
        totalAnterior: 0,
        porcentaje: 0,
    });

    const [loading, setLoading] = useState(true);
    const cacheRef = useRef({});
    const lastKeyRef = useRef(null);

    const fetchVentas = useCallback(async () => {
        const params = { id_sucursal: idSucursal, year, month, week };

        Object.keys(params).forEach(key => {
            if (params[key] === undefined || params[key] === "") {
                delete params[key];
            }
        });

        const cacheKey = JSON.stringify(params);

        if (cacheKey === lastKeyRef.current && cacheRef.current[cacheKey]) {
            setData(cacheRef.current[cacheKey]);
            setLoading(false);
            return;
        }

        lastKeyRef.current = cacheKey;
        setLoading(true);

        try {
            const response = await getTotalSalesRevenueRequest(params);
            if (response.status === 200 && response.data.code === 1) {
                const formattedData = {
                    totalRecaudado: parseFloat(response.data.totalRevenue || 0).toFixed(2),
                    totalAnterior: parseFloat(response.data.totalAnterior || 0).toFixed(2),
                    porcentaje: Number(response.data.porcentaje || 0).toFixed(2),
                };
                setData(formattedData);
                cacheRef.current[cacheKey] = formattedData;
            } else {
                setData({ totalRecaudado: 0, totalAnterior: 0, porcentaje: 0 });
            }
        } catch (error) {
            setData({ totalRecaudado: 0, totalAnterior: 0, porcentaje: 0 });
        } finally {
            setLoading(false);
        }
    }, [idSucursal, year, month, week]);

    useEffect(() => {
        fetchVentas();
    }, [fetchVentas]);

    return { ...data, loading };
};

// --- useTendenciaVentas ---
export const useTendenciaVentas = (idSucursal, year, month, week) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const cacheRef = useRef({});
    const lastKeyRef = useRef(null);

    const fetchTendenciaVentas = useCallback(async () => {
        const params = { id_sucursal: idSucursal, year, month, week };

        Object.keys(params).forEach(key => {
            if (params[key] === undefined || params[key] === "") {
                delete params[key];
            }
        });

        const cacheKey = JSON.stringify(params);

        if (cacheKey === lastKeyRef.current && cacheRef.current[cacheKey]) {
            setData(cacheRef.current[cacheKey]);
            setLoading(false);
            return;
        }

        lastKeyRef.current = cacheKey;
        setLoading(true);
        setError(null);

        try {
            const response = await getTendenciaVentasRequest(params);
            if (response.data.code === 1 && Array.isArray(response.data.data)) {
                setData(response.data.data);
                cacheRef.current[cacheKey] = response.data.data;
            } else {
                throw new Error(response.data.message || 'Error en la solicitud');
            }
        } catch (err) {
            setError('Error en la solicitud');
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [idSucursal, year, month, week]);

    useEffect(() => {
        fetchTendenciaVentas();
    }, [fetchTendenciaVentas]);

    return { data, loading, error };
};

// --- useProductoTop ---
export const useProductoTop = (idSucursal, year, month, week) => {
    const [productoTop, setProductoTop] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const cacheRef = useRef({});
    const lastKeyRef = useRef(null);

    const fetchProductoTop = useCallback(async () => {
        const params = { id_sucursal: idSucursal, year, month, week };

        Object.keys(params).forEach((key) => {
            if (params[key] === undefined || params[key] === "") {
                delete params[key];
            }
        });

        const cacheKey = JSON.stringify(params);

        if (cacheKey === lastKeyRef.current && cacheRef.current[cacheKey]) {
            setProductoTop(cacheRef.current[cacheKey]);
            setLoading(false);
            return;
        }

        lastKeyRef.current = cacheKey;
        setLoading(true);
        setError(null);

        try {
            const response = await getProductoMasVendidoRequest(params);
            if (response.data.code === 1) {
                setProductoTop(response.data.data);
                cacheRef.current[cacheKey] = response.data.data;
            } else {
                setProductoTop(null);
                setError("Error en la solicitud: " + response.data.message);
            }
        } catch (err) {
            setProductoTop(null);
            setError("Error en la solicitud: " + err.message);
        } finally {
            setLoading(false);
        }
    }, [idSucursal, year, month, week]);

    useEffect(() => {
        fetchProductoTop();
    }, [fetchProductoTop]);

    return { productoTop, loading, error };
};

// --- useCantidadVentasPorSubcategoria ---
export const useCantidadVentasPorSubcategoria = (idSucursal, year, month, week) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const cacheRef = useRef({});
    const lastKeyRef = useRef(null);

    const fetchData = useCallback(async () => {
        const params = { id_sucursal: idSucursal, year, month, week };

        Object.keys(params).forEach((key) => {
            if (params[key] === undefined || params[key] === "") {
                delete params[key];
            }
        });

        const cacheKey = JSON.stringify(params);

        if (cacheKey === lastKeyRef.current && cacheRef.current[cacheKey]) {
            setData(cacheRef.current[cacheKey]);
            setLoading(false);
            return;
        }

        lastKeyRef.current = cacheKey;
        setLoading(true);
        setError(null);

        try {
            const response = await getCantidadVentasPorSubcategoriaRequest(params);
            if (response.data.code === 1) {
                setData(response.data.data);
                cacheRef.current[cacheKey] = response.data.data;
            } else {
                setError('Error en la solicitud: ' + response.data.message);
                setData([]);
            }
        } catch (error) {
            setError('Error en la solicitud: ' + error.message);
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [idSucursal, year, month, week]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error };
};

// --- useVentasSucursal ---
export const useVentasSucursal = (year, month, week) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const cacheRef = useRef({});
    const lastKeyRef = useRef(null);

    const fetchVentasSucursal = useCallback(async () => {
        const params = { year, month, week };

        Object.keys(params).forEach((key) => {
            if (params[key] === undefined || params[key] === "") {
                delete params[key];
            }
        });

        const cacheKey = JSON.stringify(params);

        if (cacheKey === lastKeyRef.current && cacheRef.current[cacheKey]) {
            setData(cacheRef.current[cacheKey]);
            setLoading(false);
            return;
        }

        lastKeyRef.current = cacheKey;
        setLoading(true);
        setError(null);

        try {
            const response = await getSucursalMayorRendimientoRequest(params);
            if (response.data.code === 1) {
                setData(response.data.data);
                cacheRef.current[cacheKey] = response.data.data;
            } else {
                setError("Error en la solicitud: " + response.data.message);
                setData([]);
            }
        } catch (err) {
            setError("Error en la solicitud: " + err.message);
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [year, month, week]);

    useEffect(() => {
        fetchVentasSucursal();
    }, [fetchVentasSucursal]);

    return { data, loading, error };
};

// --- useVentasPDF ---
export const useVentasPDF = (params = {}) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const cacheRef = useRef({});
    const lastKeyRef = useRef(null);

    useEffect(() => {
        const fetchVentas = async () => {
            const cleanedParams = { ...params };
            Object.keys(cleanedParams).forEach((key) => {
                if (cleanedParams[key] === undefined || cleanedParams[key] === "") {
                    delete cleanedParams[key];
                }
            });

            if (Object.keys(cleanedParams).length === 0) {
                setData([]);
                setLoading(false);
                return;
            }

            const cacheKey = JSON.stringify(cleanedParams);

            if (cacheKey === lastKeyRef.current && cacheRef.current[cacheKey]) {
                setData(cacheRef.current[cacheKey]);
                setLoading(false);
                return;
            }

            lastKeyRef.current = cacheKey;
            setLoading(true);
            setError(null);

            try {
                const response = await getVentasPDFRequest(cleanedParams);
                if (response.data && response.data.data) {
                    setData(response.data.data);
                    cacheRef.current[cacheKey] = response.data.data;
                } else {
                    setData([]);
                    setError("No se encontraron datos.");
                }
            } catch (err) {
                setError("Error en la solicitud: " + err.message);
                setData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchVentas();
    }, [JSON.stringify(params)]);

    return { data, loading, error };
};
