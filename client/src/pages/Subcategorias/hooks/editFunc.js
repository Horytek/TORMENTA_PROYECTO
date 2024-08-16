import { useState } from "react";
import axios from "axios";

const useEditSubCategoria = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const editSubCategoria = async ({ id_subcategoria, id_categoria, nom_subcat, estado_subcat, nom_categoria, estado_categoria }) => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.put(`http://localhost:4000/api/subcategorias/update/${id_subcategoria}`, {
                id_subcategoria,
                id_categoria,
                nom_subcat,
                estado_subcat,
                nom_categoria,
                estado_categoria
            });

            // Handle response without console.log
            if (response.data && response.data.message) {
                
            } else {
            }
        } catch (err) {
            
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    return { editSubCategoria, loading, error };
};

export default useEditSubCategoria;
