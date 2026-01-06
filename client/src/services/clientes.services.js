import { useState, useEffect, useCallback } from 'react';
import {
    addClienteRequest,
    getClienteRequest,
    deactivateClienteRequest,
    getClientesRequest,
    updateClienteRequest,
    deleteClienteRequest
} from "@/api/api.cliente";

// --- useAddClient ---
export const useAddClient = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const addClient = async (clientData) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await addClienteRequest(clientData);

            if (response.data.code === 1) {
                return {
                    success: true,
                    data: response.data.data,
                    message: response.data.message
                };
            } else {
                throw new Error(response.data.message || 'Error inesperado al crear cliente');
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Error de conexión';
            setError(errorMessage);
            return {
                success: false,
                error: errorMessage
            };
        } finally {
            setIsLoading(false);
        }
    };

    return {
        addClient,
        isLoading,
        error
    };
};

// --- useDeactivateCliente (Formerly deactivateCliente) ---
export const useDeactivateCliente = () => {
    const [cliente, setCliente] = useState(null);
    const [getLoading, setGetLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [error, setError] = useState(null);

    const getCliente = async (id) => {
        setGetLoading(true);
        try {
            const response = await getClienteRequest(id);
            if (response.data.code === 1) {
                setCliente(response.data.data);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.message || "Error de conexión");
        } finally {
            setGetLoading(false);
        }
    };

    const darDeBajaCliente = async (clientId) => {
        setDeleteLoading(true);
        try {
            const response = await deactivateClienteRequest(clientId);
            if (response.status === 204 || !response.data) {
                return { success: true };
            }
            return { success: true, ...response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data || error.message,
            };
        } finally {
            setDeleteLoading(false);
        }
    };

    return { cliente, error, getLoading, deleteLoading, getCliente, darDeBajaCliente };
};

// --- Helper for Frontend Bulk Operations ---
export const bulkUpdateClientes = async (action, ids, items = []) => {
    // Frontend-side loop since API doesn't support bulk yet
    try {
        const promises = ids.map(id => {
            if (action === 'deactivate') {
                return deactivateClienteRequest(id);
            } else if (action === 'activate') {
                const item = items.find(i => i.id_cliente === id);
                if (item) {
                    // Safe update with full object
                    return updateClienteRequest({ ...item, estado: 1 });
                }
                // Fallback (unsafe) if item not found, or maybe just skip
                return updateClienteRequest({ id_cliente: id, estado: 1 });
            }
            return Promise.resolve();
        });

        await Promise.all(promises);
        return true;
    } catch (e) {
        console.error("Bulk update error", e);
        return false;
    }
};

// --- useGetClientes ---
export const useGetClientes = (
    initialPage = 1,
    initialLimit = 10,
    initialDocType = "",
    initialDocNumber = "",
    initialSearchTerm = ""
) => {
    const [allClientes, setAllClientes] = useState([]); // Todos los clientes traídos una sola vez
    const [clientes, setClientes] = useState([]);
    const [metadata, setMetadata] = useState({
        page: initialPage,
        limit: initialLimit,
        totalPages: 1,
        totalRecords: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Solo consulta la base de datos la primera vez
    useEffect(() => {
        const fetchAllClientes = async () => {
            setLoading(true);
            setError(null);
            try {
                // Trae todos los clientes sin filtros ni paginación
                const response = await getClientesRequest({
                    page: 1,
                    limit: 1000000, // Traer todos
                });
                if (response.data.code === 1) {
                    const clientesConId = response.data.data.map(cliente => ({
                        id: cliente.id_cliente,
                        ...cliente,
                    }));
                    setAllClientes(clientesConId);
                } else {
                    setError('Error inesperado al obtener clientes.');
                }
            } catch (err) {
                setError(err.message || 'Error de conexión');
            } finally {
                setLoading(false);
            }
        };
        fetchAllClientes();
    }, []);

    // Filtrado y paginación local
    const refetch = useCallback((
        page = initialPage,
        limit = initialLimit,
        docType = initialDocType,
        docNumber = initialDocNumber,
        searchTerm = initialSearchTerm
    ) => {
        setLoading(true);
        let filtrados = [...allClientes];

        // Filtro por tipo de documento
        if (docType === "dni") {
            if (docNumber) {
                filtrados = filtrados.filter(c => (c.dni || '').includes(docNumber));
            } else {
                filtrados = filtrados.filter(c => c.dni && c.dni !== '');
            }
        } else if (docType === "ruc") {
            if (docNumber) {
                filtrados = filtrados.filter(c => (c.ruc || '').includes(docNumber));
            } else {
                filtrados = filtrados.filter(c => c.ruc && c.ruc !== '');
            }
        }

        // Filtro por término de búsqueda
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtrados = filtrados.filter(c =>
                (c.nombres || '').toLowerCase().includes(term) ||
                (c.apellidos || '').toLowerCase().includes(term) ||
                (c.razon_social || '').toLowerCase().includes(term)
            );
        }

        const totalRecords = filtrados.length;
        const totalPages = Math.ceil(totalRecords / limit) || 1;
        const start = (page - 1) * limit;
        const end = start + limit;
        setClientes(filtrados.slice(start, end));
        setMetadata({
            page,
            limit,
            totalPages,
            totalRecords,
        });
        setLoading(false);
    }, [allClientes]);

    // Refresca la tabla cada vez que cambia el array base
    useEffect(() => {
        refetch(initialPage, initialLimit, initialDocType, initialDocNumber, initialSearchTerm);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allClientes]);

    return {
        clientes,
        metadata,
        loading,
        error,
        refetch,
        setAllClientes // Para actualizar el array local tras agregar/editar/eliminar
    };
};

// --- useUpdateClient ---
export const useUpdateClient = () => {
    const [cliente, setCliente] = useState(null);
    const [getLoading, setGetLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const getCliente = async (id) => {
        setGetLoading(true);
        try {
            const response = await getClienteRequest(id);
            if (response.data.code === 1) {
                setCliente(response.data.data);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.message || "Error de conexión");
        } finally {
            setGetLoading(false);
        }
    };

    const updateClient = async (clientData) => {
        setIsLoading(true);
        try {
            const response = await updateClienteRequest(clientData);
            if (response.data.code === 1) {
                setCliente(response.data.data);
                return { success: true, data: response.data.data };
            }
            setError(response.data.message);
            return { success: false, error: response.data.message };
        } catch (error) {
            setError(error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data || error.message,
            };
        } finally {
            setIsLoading(false);
        }
    };

    return {
        cliente,
        error,
        getLoading,
        isLoading,
        getCliente,
        updateClient
    };
};

// --- useCliente ---
export const useCliente = () => {
    const [cliente, setCliente] = useState(null);
    const [getLoading, setGetLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [error, setError] = useState(null);

    const getCliente = async (id) => {
        setGetLoading(true);
        try {
            const response = await getClienteRequest(id);
            if (response.data.code === 1) {
                setCliente(response.data.data);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.message || "Error de conexión");
        } finally {
            setGetLoading(false);
        }
    };

    const deleteClient = async (clientId) => {
        setDeleteLoading(true);
        try {
            const response = await deleteClienteRequest(clientId);
            if (response.status === 204 || !response.data) {
                return { success: true };
            }
            return { success: true, ...response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data || error.message,
            };
        } finally {
            setDeleteLoading(false);
        }
    };

    return { cliente, error, getLoading, deleteLoading, getCliente, deleteClient };
};
