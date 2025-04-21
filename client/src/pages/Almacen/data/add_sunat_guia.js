import axios from "@/api/axios";
import { getEmpresaDataByUser } from "@/services/empresa.services";
import { getClaveSunatByUser } from "@/services/clave.services";
import toast from 'react-hot-toast';

function convertDateToDesiredFormat(dateString, offsetHours) {
  // Crear una instancia de la fecha en UTC
  const date = new Date(dateString);

  // Ajustar la fecha al desfase horario deseado
  const offsetMilliseconds = offsetHours * 60 * 60 * 1000;
  const adjustedDate = new Date(date.getTime() - offsetMilliseconds);

  // Obtener los componentes de la fecha en el formato deseado
  const year = adjustedDate.getFullYear();
  const month = String(adjustedDate.getMonth() + 1).padStart(2, '0'); // Meses están en el rango [0, 11]
  const day = String(adjustedDate.getDate()).padStart(2, '0');
  const hours = String(adjustedDate.getHours()).padStart(2, '0');
  const minutes = String(adjustedDate.getMinutes()).padStart(2, '0');
  const seconds = String(adjustedDate.getSeconds()).padStart(2, '0');

  // Formatear en la cadena deseada
  const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}-05:00`;
  return formattedDate;
}

const enviarGuiaRemisionASunat = async (data) => {
  const url = 'https://facturacion.apisperu.com/api/v1/despatch/send';
  const token = await getClaveSunatByUser();
    
  console.log('Payload enviado:', JSON.stringify(data, null, 2)); // Verificar los datos enviados

  try {
    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Respuesta de la API:', response.data);

    if (response.status === 200) {
      toast.success(`La guía de remisión se ha enviado con éxito a la Sunat.`);
    } else {
      toast.error('Error al enviar la guía de remisión a la Sunat. Por favor, inténtelo de nuevo.');
    }
  } catch (error) {
    console.error('Error en la solicitud:', error.response ? error.response.data : error.message);
    if (error.response) {
      toast.error(`Error al enviar la guía de remisión a la Sunat: ${error.response.status} - ${error.response.data}`);
    } else {
      toast.error('Error al enviar la guía de remisión a la Sunat. Por favor, inténtelo de nuevo.');
    }
  }
};

export const handleGuiaRemisionSunat = async (guia, destinata, transportista, detalles) => {
      // Obtener los datos de la empresa
      const empresaData = await getEmpresaDataByUser();
  const tipoDoc = "05";
  const guialetra = "T";
  const guiaserie = guia.serieNum;
  const ultimaSerie = guialetra + guiaserie;
  const isoDate = guia.fechaEmision;
  const offsetHours = -5; // Ajuste de zona horaria para -05:00
  const result = convertDateToDesiredFormat(isoDate, offsetHours);
  const undPeso = "KGM";

  const data = {
    version: 2022,
    tipoDoc: tipoDoc,
    serie: ultimaSerie.toString(),
    correlativo: guia.num,
    fechaEmision: result,
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
    destinatario: {
      numDoc: destinata.documento,
      rznSocial: destinata.destinatario
    },
    observacion: guia.glosa || "",
    envio: {
      fecTraslado: result,
      pesoTotal: guia.peso,
      undPesoTotal: undPeso,
      llegada: {
        ubigueo: guia.id_ubigeo_d,
        direccion: guia.dir_destino
      },
      partida: {
        ubigueo: guia.id_ubigeo_o,
        direccion: guia.dir_partida
      },
      transportista: {
        numDoc: guia.docpub || guia.docpriv,
        rznSocial: guia.transportistapub || guia.transportistapriv,
        placa: transportista.placa || "",
      }
    },
    details: detalles.map(detalle => ({
      cantidad: detalle.cantidad,
      unidad: detalle.um || '',
      descripcion: detalle.descripcion,
      codigo: detalle.codigo
    }))
  };

  const loadingToastId = toast.loading('Se están enviando los datos a la Sunat...');
  console.log('Datos de la guía de remisión:', data);
  enviarGuiaRemisionASunat(data)
    .then(() => {
      toast.dismiss(loadingToastId);
    })
    .catch(() => {
      toast.dismiss(loadingToastId);
    });
};
