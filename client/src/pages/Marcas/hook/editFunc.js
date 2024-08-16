import { useState } from "react";
import axios from "axios";

const useEditMarca = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const editMarca = async ({ id_marca, nom_marca , estado_marca }) => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.put(`http://localhost:4000/api/marcas/update/${id_marca}`, {
                id_marca, 
                nom_marca, 
                estado_marca 
            });

            if (response.data && response.data.message) {
                // toast.success(response.data.message);
            } else {
              //  toast.success("Marca actualizada con éxito");
            }
        } catch (err) {
            setError(err);
           // toast.error("Error al actualizar la marca");
        } finally {
            setLoading(false);
        }
    };

    return { editMarca, loading, error };
};

export default useEditMarca;
