import { useState, useEffect } from 'react';
import {
  getClientesRequest,
  getClienteRequest,
  addClienteRequest,
  updateClienteRequest,
  deleteClienteRequest,
  deactivateClienteRequest,
} from "@/api/api.cliente";



// Obtener todos los clientes
const getClientes = async () => {
  try {
    const response = await getClientesRequest();
    if (response.data.code === 1) {
      return response.data.data;
    } else {
      console.error("Error al obtener clientes:", response.data.message);
    }
  } catch (error) {
    console.error("Error del servidor:", error.message);
  }
};

// Obtener cliente por ID
const getCliente = async (id) => {
  try {
    const response = await getClienteRequest(id);
    if (response.data.code === 1) {
      return response.data.data;
    } else {
      console.error("Error al obtener cliente:", response.data.message);
    }
  } catch (error) {
    console.error("Error del servidor:", error.message);
  }
};

// Agregar cliente
const addCliente = async (cliente) => {
  try {
    const response = await addClienteRequest(cliente);
    if (response.data.code === 1) {
      return { success: true, id_cliente: response.data.id_cliente };
    } else {
      return { success: false };
    }
  } catch (error) {
    return { success: false };
  }
};

// Actualizar cliente
const updateCliente = async (cliente) => {
  try {
    const response = await updateClienteRequest(cliente);
    if (response.data.code === 1) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};

// Eliminar cliente
const deleteCliente = async (id) => {
  try {
    const response = await deleteClienteRequest(id);
    if (response.data.code === 1) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};

const useAddClient = () => {
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

const deactivateCliente = () => {
  const [cliente, setCliente] = useState(null);
  const [getLoading, setGetLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState(null);

  const getCliente = async (id) => {
    setGetLoading(true);
    try {
      const response = await deactivateClienteRequest(id);
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

const useUpdateClient = () => {
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

const useCliente = () => {
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

const useGetClientes = (
  initialPage = 1,
  initialLimit = 10,
  initialDocType = "",
  initialDocNumber = "",
  initialSearchTerm = ""
) => {
  const [clientes, setClientes] = useState([]);
  const [metadata, setMetadata] = useState({
    page: initialPage,
    limit: initialLimit,
    totalPages: 1,
    totalRecords: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClientes = async (
    page = initialPage,
    limit = initialLimit,
    docType = initialDocType,
    docNumber = initialDocNumber,
    searchTerm = initialSearchTerm
  ) => {
    try {
      setLoading(true);
      const response = await axios.get('/clientes/', {
        params: {
          page,
          limit,
          docType,
          docNumber,
          searchTerm
        }
      });

      if (response.data.code === 1) {
        const clientesConId = response.data.data.map(cliente => ({
          id: cliente.id_cliente,
          ...cliente,
        }));
        setClientes(clientesConId);
        setMetadata(response.data.metadata);
      } else {
        setError('Error inesperado al obtener clientes.');
      }
    } catch (err) {
      setError(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  return {
    clientes,
    metadata,
    loading,
    error,
    refetch: fetchClientes
  };
};

export {
  getClientes,
  getCliente,
  addCliente,
  updateCliente,
  deleteCliente,
  deactivateCliente,
  useAddClient,
  useCliente,
  useUpdateClient,
  useGetClientes
};
