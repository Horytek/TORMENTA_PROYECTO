import { useState } from "react";
import axios from "@/api/axios";

const useDeleteSubModulo = () => {
    const [deleteloading, setDeleteLoading] = useState(false);
    const [error, setError] = useState(null);

    const deleteSubModulo = async (id) => {
        setDeleteLoading(true);
        setError(null);
        try {
            const response = await axios.delete(`/submodulos/${id}`);
            setDeleteLoading(false);
            return response.data; 
        } catch (err) {
            setDeleteLoading(false);
            setError(err.response?.data?.message || err.message);
            throw err;
        }
    };

    return { deleteSubModulo, deleteloading, error };
};

export default useDeleteSubModulo;