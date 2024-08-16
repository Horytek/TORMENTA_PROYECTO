import { useState } from "react";
import axios from "axios";

const useEditCat = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const editCat = async ({ id_categoria, nom_categoria , estado_categoria }) => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.put(`http://localhost:4000/api/categorias/update/${id_categoria}`, {
                id_categoria, 
                nom_categoria, 
                estado_categoria 
            });

            if (response.data && response.data.message) {
               // toast.success(response.data.message);
            } else {
              //  toast.success("Categoría actualizada con éxito");
            }
        } catch (err) {
            setError(err);
           // toast.error("Error al actualizar la categoria");
        } finally {
            setLoading(false);
        }
    };

    return { editCat, loading, error };
};

export default useEditCat;
