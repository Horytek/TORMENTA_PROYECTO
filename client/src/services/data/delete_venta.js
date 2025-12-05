//import axios from 'axios';
import { toast } from "react-hot-toast";
import axios from "@/api/axios";
import {
  deleteVentaRequest
} from "@/api/api.ventas";

// Maneja la solicitud de cobro
export const handleDelete = async (datosVenta) => {
  const payload = {
    id_venta: datosVenta.id,
    comprobante: datosVenta.tipoComprobante,
    estado_sunat: Number(datosVenta.estado_sunat) || 0, // normalizar
    usua: datosVenta.usua_usuario,
    id_usuario: datosVenta.id_usuario,
  };

  try {
    const response = await deleteVentaRequest(payload);

    if (response.status === 200) {
      toast.success('Venta eliminada correctamente');
    } else {
      console.error('Error al registrar la venta:', response.data);
    }
  } catch (error) {
    console.error('Error de red:', error);
  }
};