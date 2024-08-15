import { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

const useEditSubCategoria = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const editSubCategoria = async ({ id_subcategoria, id_categoria, nom_subcat, estado_subcat, nom_categoria, estado_categoria }) => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.put(`http://localhost:4000/api/subcategorias/update/${id_subcategoria}`, {
                id_categoria,
                nom_subcat,
                estado_subcat,
                nom_categoria,
                estado_categoria
            });

            if (response.data && response.data.message) {
                toast.success(response.data.message);
            } else {
                toast.success("Subcategoría y categoría actualizadas con éxito");
            }
        } catch (err) {
            setError(err);
            toast.error("Error al actualizar la subcategoría o categoría");
        } finally {
            setLoading(false);
        }
    };

    return { editSubCategoria, loading, error };
};

export default useEditSubCategoria;
