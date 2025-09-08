import axios from '@/api/axios';
import { getEmpresaDataByUser } from "@/services/empresa.services";
import { getClaveSunatByUser } from "@/services/clave.services";
import toast from 'react-hot-toast';
import { useUserStore } from "@/store/useStore";
// ==========================
// Función para formatear fechas
// ==========================
function convertDateToDesiredFormat(dateString, offsetHours) {
  const date = new Date(dateString);
  const offsetMilliseconds = offsetHours * 60 * 60 * 1000;
  const adjustedDate = new Date(date.getTime() - offsetMilliseconds);

  const year = adjustedDate.getFullYear();
  const month = String(adjustedDate.getMonth() + 1).padStart(2, '0');
  const day = String(adjustedDate.getDate()).padStart(2, '0');
  const hours = String(adjustedDate.getHours()).padStart(2, '0');
  const minutes = String(adjustedDate.getMinutes()).padStart(2, '0');
  const seconds = String(adjustedDate.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}-05:00`;
}

// ==========================
// Función para anular una venta en SUNAT (Tipo F)
// ==========================
export const anularVentaEnSunatF = async (ventaData) => {
  try {
    const url = 'https://facturacion.apisperu.com/api/v1/voided/send';
    const nombre = useUserStore.getState().nombre;
    let token;
    try {
      token = await getClaveSunatByUser(nombre);
    } catch {
      console.warn('Clave Sunat no configurada; se omite envío a SUNAT');
      return;
    }
    const empresaData = await getEmpresaDataByUser(nombre);

    const isoDate = ventaData.fechaEmision;
    const localDate = new Date().toISOString().slice(0, 10);
    const offsetHours = -5;

    const fecGeneracion = convertDateToDesiredFormat(isoDate, offsetHours);
    const fecComunicacion = convertDateToDesiredFormat(localDate, offsetHours);

    const tipoDocMapping = { "Boleta": "B", "Factura": "F" };
    const nuevaSerie = `${tipoDocMapping[ventaData.tipoComprobante] || "B"}${ventaData.serieNum}`;

    const data = {
      correlativo: ventaData.anular,
      fecGeneracion,
      fecComunicacion,
      company: {
        ruc: empresaData.ruc,
        razonSocial: empresaData.razonSocial,
        nombreComercial: empresaData.nombreComercial,
        address: {
          direccion: empresaData.direccion,
          provincia: empresaData.provincia,
          departamento: empresaData.departamento,
          distrito: empresaData.distrito,
          ubigueo: empresaData.ubigueo,
        },
      },
      details: [
        {
          tipoDoc: "01",
          serie: nuevaSerie,
          correlativo: ventaData.num.toString(),
          desMotivoBaja: "ERROR EN CÁLCULOS",
        },
      ],
    };

    //console.log('Payload enviado:', JSON.stringify(data, null, 2));

    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    //console.log('Respuesta de la API:', response.data);

    if (response.status === 200) {
      toast.success('La anulación de la venta se ha enviado con éxito a la Sunat.');
    } else {
      toast.error('Error al anular la venta en la Sunat. Por favor, inténtelo de nuevo.');
    }
} catch (error) {
    // Log interno solo el mensaje general
    console.error('Error en la solicitud:', error.message);
    // Mensaje genérico para el usuario, sin detalles internos ni datos sensibles
    toast.error('Error al anular la venta en la Sunat. Por favor, inténtelo de nuevo más tarde.');
}
};

// ==========================
// Función para anular una venta en SUNAT (Tipo B)
// ==========================
export const anularVentaEnSunatB = async (ventaData, detalles) => {
  try {
    const url = 'https://facturacion.apisperu.com/api/v1/summary/send';
    const nombre = useUserStore.getState().nombre;
    let token;
    try {
      token = await getClaveSunatByUser(nombre);
    } catch {
      console.warn('Clave Sunat no configurada; se omite envío a SUNAT');
      return;
    }
    const empresaData = await getEmpresaDataByUser(nombre);

    const isoDate = ventaData.fechaEmision;
    const localDate = new Date().toISOString().slice(0, 10);
    const offsetHours = -5;

    const fecGeneracion = convertDateToDesiredFormat(isoDate, offsetHours);
    const fecResumen = convertDateToDesiredFormat(localDate, offsetHours);

    const totalGravada = detalles.reduce((acc, detalle) => {
      const precioUnitarioConIgv = parseFloat(detalle.precio.replace('S/ ', ''));
      const precioSinIgv = precioUnitarioConIgv / 1.18;
      return acc + (precioSinIgv * detalle.cantidad);
    }, 0);

    const mtoIGV = totalGravada * 0.18;
    const subTotal = totalGravada + mtoIGV;

    const tipoDocMapping = { "Boleta": "B", "Factura": "F" };
    const nuevaSerie = `${tipoDocMapping[ventaData.tipoComprobante] || "B"}${ventaData.serieNum}`;
    const serieNum = `${nuevaSerie}-${ventaData.num}`;
    const tipoDocCliente = ventaData.documento.length === 11 ? "6" : "1";

    const data = {
      fecGeneracion,
      fecResumen,
      correlativo: ventaData.anular_b,
      moneda: "PEN",
      company: {
        ruc: empresaData.ruc,
        razonSocial: empresaData.razonSocial,
        nombreComercial: empresaData.nombreComercial,
        address: {
          direccion: empresaData.direccion,
          provincia: empresaData.provincia,
          departamento: empresaData.departamento,
          distrito: empresaData.distrito,
          ubigueo: empresaData.ubigueo,
        },
      },
      details: [
        {
          tipoDoc: "03",
          serieNro: serieNum,
          estado: "3",
          clienteTipo: tipoDocCliente,
          clienteNro: ventaData.documento,
          total: subTotal.toFixed(2),
          mtoOperGravadas: totalGravada.toFixed(2),
          mtoOperInafectas: 0,
          mtoOperExoneradas: 0,
          mtoOperExportacion: 0,
          mtoOtrosCargos: 0,
          mtoIGV: mtoIGV.toFixed(2),
        },
      ],
    };

    //console.log('Payload enviado:', JSON.stringify(data, null, 2));

    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    //console.log('Respuesta de la API:', response.data);

    if (response.status === 200) {
      toast.success('La anulación de la venta se ha enviado con éxito a la Sunat.');
    } else {
      toast.error('Error al anular la venta en la Sunat. Por favor, inténtelo de nuevo.');
    }
} catch (error) {
    // Log interno solo el mensaje general
    console.error('Error en la solicitud:', error.message);
    // Mensaje genérico para el usuario, sin detalles internos ni datos sensibles
    toast.error('Error al anular la venta en la Sunat. Por favor, inténtelo de nuevo más tarde.');
}
};