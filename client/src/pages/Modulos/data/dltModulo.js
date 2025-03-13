import { useState } from "react";
import axios from "@/api/axios";

const useDeleteModulo = () => {
    const [deleteloading, setDeleteLoading] = useState(false);
    const [error, setError] = useState(null);

    const deleteModulo = async (id) => {
        setDeleteLoading(true);
        setError(null);
        try {
            const response = await axios.delete(`/modulos/${id}`);
            setDeleteLoading(false);
            return response.data; 
        } catch (err) {
            setDeleteLoading(false);
            setError(err.response?.data?.message || err.message);
            throw err;
        }
    };

    return { deleteModulo, deleteloading, error };
};

export default useDeleteModulo;