import { useState } from "react";
import axios from "@/api/axios";

const useCliente = () => {
    const [cliente, setCliente] = useState(null);
    const [getLoading, setGetLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [error, setError] = useState(null);

    const getCliente = async (id) => {
        setGetLoading(true);
        try {
            const response = await axios.get(`/clientes/getCliente/${id}`);
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
            const response = await axios.delete(`/clientes/deleteCliente/${clientId}`);
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

export default useCliente;