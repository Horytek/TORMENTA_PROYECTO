import { useState } from "react";
import axios from "@/api/axios";

const useUpdateClient = () => {
    const [cliente, setCliente] = useState(null);
    
    const [isLoading, setIsLoading] = useState(false);

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

    const updateClient = async (clientData) => {
        setIsLoading(true);
        try {
            const response = await axios.put("/clientes/updateCliente", clientData);
            if (response.data.code === 1) {
                return { success: true, data: response.data.data };
            }
            return { success: false, error: response.data.message };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data || error.message,
            };
        } finally {
            setIsLoading(false);
        }
    };

    return { updateClient, isLoading };
};

export default useUpdateClient;